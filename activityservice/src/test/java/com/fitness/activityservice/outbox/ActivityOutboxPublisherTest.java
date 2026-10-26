package com.fitness.activityservice.outbox;

import com.fitness.activityservice.model.Activity;
import com.fitness.events.ActivityEvent;
import com.mongodb.client.result.UpdateResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityOutboxPublisherTest {
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private RabbitTemplate rabbitTemplate;

    @Test
    void brokerConfirmationMarksTheClaimedEventAsSent() {
        ActivityOutboxPublisher publisher = publisherWithClaimedEvent(1);
        mockConfirm(true);
        UpdateResult updateResult = updateResult();
        when(updateResult.getModifiedCount()).thenReturn(1L);
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(ActivityOutboxEvent.class)))
                .thenReturn(updateResult);

        publisher.publishNext();

        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(
                any(Query.class), updateCaptor.capture(), eq(ActivityOutboxEvent.class));
        assertEquals(ActivityOutboxEvent.Status.SENT,
                updateCaptor.getValue().getUpdateObject().get("$set", org.bson.Document.class).get("status"));
    }

    @Test
    void negativeBrokerConfirmationMakesTheEventRetryable() {
        ActivityOutboxPublisher publisher = publisherWithClaimedEvent(1);
        mockConfirm(false);
        UpdateResult updateResult = updateResult();
        when(updateResult.getMatchedCount()).thenReturn(1L);
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(ActivityOutboxEvent.class)))
                .thenReturn(updateResult);

        publisher.publishNext();

        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(
                any(Query.class), updateCaptor.capture(), eq(ActivityOutboxEvent.class));
        assertEquals(ActivityOutboxEvent.Status.PENDING,
                updateCaptor.getValue().getUpdateObject().get("$set", org.bson.Document.class).get("status"));
    }

    private ActivityOutboxPublisher publisherWithClaimedEvent(int attempts) {
        Activity activity = Activity.builder().id("activity-1").userId("owner-1").build();
        ActivityEvent payload = new ActivityEvent("event-1", activity);
        ActivityOutboxEvent claimed = ActivityOutboxEvent.builder()
                .id("event-1")
                .payload(payload)
                .status(ActivityOutboxEvent.Status.PUBLISHING)
                .attempts(attempts)
                .createdAt(Instant.now())
                .build();
        when(mongoTemplate.findAndModify(
                any(Query.class),
                any(Update.class),
                any(FindAndModifyOptions.class),
                eq(ActivityOutboxEvent.class))).thenReturn(claimed);
        ActivityOutboxPublisher publisher = new ActivityOutboxPublisher(mongoTemplate, rabbitTemplate);
        ReflectionTestUtils.setField(publisher, "exchange", "fitness.exchange");
        ReflectionTestUtils.setField(publisher, "routingKey", "activity.tracking");
        return publisher;
    }

    private void mockConfirm(boolean ack) {
        doAnswer(invocation -> {
            CorrelationData correlation = invocation.getArgument(4);
            correlation.getFuture().complete(new CorrelationData.Confirm(ack, "test-confirm"));
            return null;
        }).when(rabbitTemplate).convertAndSend(
                anyString(),
                anyString(),
                any(),
                any(MessagePostProcessor.class),
                any(CorrelationData.class));
    }

    private UpdateResult updateResult() {
        return mock(UpdateResult.class);
    }
}
