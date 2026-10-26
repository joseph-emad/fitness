package com.fitness.activityservice.outbox;

import com.fitness.events.ActivityEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "activity_outbox")
@CompoundIndexes({
        @CompoundIndex(name = "pending_events", def = "{'status': 1, 'nextAttemptAt': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "expired_leases", def = "{'status': 1, 'leaseUntil': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityOutboxEvent {
    @Id
    private String id;
    private ActivityEvent payload;
    private Status status;
    private int attempts;
    private Instant createdAt;
    private Instant nextAttemptAt;
    private Instant leaseUntil;
    private Instant sentAt;
    private String lastError;

    public static ActivityOutboxEvent pending(ActivityEvent payload, Instant now) {
        return ActivityOutboxEvent.builder()
                .id(payload.getEventId())
                .payload(payload)
                .status(Status.PENDING)
                .attempts(0)
                .createdAt(now)
                .nextAttemptAt(now)
                .build();
    }

    public enum Status {
        PENDING,
        PUBLISHING,
        SENT,
        FAILED
    }
}
