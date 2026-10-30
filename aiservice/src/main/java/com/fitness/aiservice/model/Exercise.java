package com.fitness.aiservice.model;

import lombok.Data;

@Data
public class Exercise {
    private String name;
    private Integer sets;
    private Integer reps;
    private Double weightKg;
    private Integer restSeconds;
}
