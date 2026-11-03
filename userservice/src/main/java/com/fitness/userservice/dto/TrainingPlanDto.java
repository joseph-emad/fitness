package com.fitness.userservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class TrainingPlanDto {
    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String notes;

    @Valid
    @NotEmpty(message = "At least one week is required")
    @Size(max = 52)
    private List<Week> weeks = new ArrayList<>();

    private LocalDateTime updatedAt;

    @Data
    public static class Week {
        @Size(max = 100)
        private String name;
        @Valid
        @Size(max = 7)
        private List<Day> days = new ArrayList<>();
    }

    @Data
    public static class Day {
        @Size(max = 100)
        private String name;
        @Valid
        @Size(max = 30)
        private List<Exercise> exercises = new ArrayList<>();
    }

    @Data
    public static class Exercise {
        @NotBlank(message = "Exercise name is required")
        @Size(max = 100)
        private String name;
        private Integer sets;
        private Integer reps;
        @Size(max = 500)
        private String notes;
    }
}
