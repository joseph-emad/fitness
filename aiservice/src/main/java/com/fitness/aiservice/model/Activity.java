package com.fitness.aiservice.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@Data
public class Activity {
    private String id;
    private String userId;
    private String type;
    private Integer duration;
    private Integer caloriesBurned;
    private LocalDateTime startTime;
    private List<Exercise> exercises;
    private Map<String, Object> additionalMetrics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
