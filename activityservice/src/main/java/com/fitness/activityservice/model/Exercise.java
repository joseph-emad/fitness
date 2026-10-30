package com.fitness.activityservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {
    private String name;
    private Integer sets;
    private Integer reps;
    private Double weightKg;
    private Integer restSeconds;
}
