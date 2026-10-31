package com.fitness.userservice.dto;

import com.fitness.userservice.model.TrainingRequestStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TrainingRequestResponse {
    private String id;
    private String traineeId;
    private String traineeName;
    private String traineeEmail;
    private String coachId;
    private String coachName;
    private String coachEmail;
    private String message;
    private TrainingRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
