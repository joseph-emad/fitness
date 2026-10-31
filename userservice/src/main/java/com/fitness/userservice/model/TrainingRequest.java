package com.fitness.userservice.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "training_requests")
@Data
public class TrainingRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Keycloak subject IDs, matching the X-User-ID header
    @Column(nullable = false)
    private String traineeId;

    @Column(nullable = false)
    private String coachId;

    @Column(length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingRequestStatus status = TrainingRequestStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
