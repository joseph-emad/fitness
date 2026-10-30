package com.fitness.activityservice.dto;

import com.fitness.activityservice.model.ActivityType;
import com.fitness.activityservice.model.Exercise;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class ActivityRequest {
    private String userId;
    private ActivityType type;
    private Integer duration;
    private Integer caloriesBurned;
    private LocalDateTime startTime;
    private List<Exercise> exercises;
    private Map<String, Object> additionalMetrics;
}
