package com.fitness.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TrainingRequestCreate {
    @NotBlank(message = "Coach is required")
    private String coachId;

    @NotBlank(message = "Goal is required")
    @Size(max = 500, message = "Goal must be at most 500 characters")
    private String goal;

    @Size(max = 500, message = "Message must be at most 500 characters")
    private String message;
}
