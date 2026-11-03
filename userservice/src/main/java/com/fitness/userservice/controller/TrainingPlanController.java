package com.fitness.userservice.controller;

import com.fitness.userservice.dto.TrainingPlanDto;
import com.fitness.userservice.service.TrainingPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/training-plans")
@RequiredArgsConstructor
public class TrainingPlanController {
    private final TrainingPlanService service;

    @GetMapping("/request/{requestId}")
    public ResponseEntity<TrainingPlanDto> get(
            @PathVariable String requestId, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.get(requestId, userId));
    }

    @PutMapping("/request/{requestId}")
    public ResponseEntity<TrainingPlanDto> save(
            @PathVariable String requestId,
            @Valid @RequestBody TrainingPlanDto plan,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.save(requestId, userId, plan));
    }
}
