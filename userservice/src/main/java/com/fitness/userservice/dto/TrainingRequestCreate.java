package com.fitness.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TrainingRequestCreate {
    @NotBlank(message = "Coach is required")
    private String coachId;

    @Size(max = 500, message = "Message must be at most 500 characters")
    private String message;
}
