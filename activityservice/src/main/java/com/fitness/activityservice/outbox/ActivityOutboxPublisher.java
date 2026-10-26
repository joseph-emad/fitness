package com.fitness.activityservice.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.mongodb.client.result.UpdateResult;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@ConditionalOnProperty(name = "outbox.publisher.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class ActivityOutboxPublisher {
    private static final int MAX_ATTEMPTS = 10;
    private static final long LEASE_SECONDS = 60;
    private static final long MAX_BACKOFF_SECONDS = 300;

    private final MongoTemplate mongoTemplate;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Scheduled(fixedDelayString = "${outbox.publisher.fixed-delay-ms:1000}")
    public void publishNext() {
        ActivityOutboxEvent event;
        try {
            event = claimNext();
        } catch (Exception exception) {
            log.error("Could not claim an activity outbox event", exception);
            return;
        }
        if (event == null) {
            return;
        }

        try {
            CorrelationData correlation = new CorrelationData(event.getId());
            rabbitTemplate.convertAndSend(
                    exchange,
                    routingKey,
                    event.getPayload(),
                    message -> {
                        message.getMessageProperties().setMessageId(event.getId());
                        return message;
                    },
                    correlation);
            var confirm = correlation.getFuture().get(10, TimeUnit.SECONDS);
            if (!confirm.ack()) {
                throw new IllegalStateException("RabbitMQ rejected event: " + confirm.reason());
            }
            if (correlation.getReturned() != null) {
                throw new IllegalStateException(
                        "RabbitMQ did not route event: " + correlation.getReturned().getReplyText());
            }
            markSent(event);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            recordFailure(event, exception);
        } catch (Exception exception) {
            recordFailure(event, exception);
        }
    }

    private ActivityOutboxEvent claimNext() {
        Instant now = Instant.now();
        Criteria pending = new Criteria().andOperator(
                where("status").is(ActivityOutboxEvent.Status.PENDING),
                where("nextAttemptAt").lte(now));
        Criteria expiredLease = new Criteria().andOperator(
                where("status").is(ActivityOutboxEvent.Status.PUBLISHING),
                where("leaseUntil").lte(now));
        Query query = new Query(new Criteria().orOperator(pending, expiredLease))
                .with(Sort.by("createdAt").ascending());
        Update update = new Update()
                .set("status", ActivityOutboxEvent.Status.PUBLISHING)
                .set("leaseUntil", now.plusSeconds(LEASE_SECONDS))
                .inc("attempts", 1);
        return mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                ActivityOutboxEvent.class);
    }

    private void markSent(ActivityOutboxEvent event) {
        Update update = new Update()
                .set("status", ActivityOutboxEvent.Status.SENT)
                .set("sentAt", Instant.now())
                .unset("leaseUntil")
                .unset("lastError");
        UpdateResult result = mongoTemplate.updateFirst(
                Query.query(where("_id").is(event.getId())
                        .and("status").is(ActivityOutboxEvent.Status.PUBLISHING)),
                update,
                ActivityOutboxEvent.class);
        if (result.getModifiedCount() != 1) {
            throw new IllegalStateException("Outbox event was no longer claimed: " + event.getId());
        }
    }

    private void recordFailure(ActivityOutboxEvent event, Exception exception) {
        Instant now = Instant.now();
        boolean exhausted = event.getAttempts() >= MAX_ATTEMPTS;
        long backoff = Math.min(5L << Math.min(event.getAttempts() - 1, 6), MAX_BACKOFF_SECONDS);
        Update update = new Update()
                .set("status", exhausted
                        ? ActivityOutboxEvent.Status.FAILED
                        : ActivityOutboxEvent.Status.PENDING)
                .set("lastError", errorMessage(exception))
                .unset("leaseUntil");
        if (exhausted) {
            update.unset("nextAttemptAt");
            log.error("Activity outbox event {} exhausted retries and was marked FAILED",
                    event.getId(), exception);
        } else {
            update.set("nextAttemptAt", now.plusSeconds(backoff));
            log.warn("Activity outbox event {} publish failed; retrying after {} seconds",
                    event.getId(), backoff, exception);
        }
        UpdateResult result = mongoTemplate.updateFirst(
                Query.query(where("_id").is(event.getId())
                        .and("status").is(ActivityOutboxEvent.Status.PUBLISHING)),
                update,
                ActivityOutboxEvent.class);
        if (result.getMatchedCount() == 0) {
            log.error("Could not record failure for activity outbox event {}", event.getId(), exception);
        }
    }

    private String errorMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            message = exception.getClass().getSimpleName();
        }
        return message.substring(0, Math.min(message.length(), 1000));
    }
}
