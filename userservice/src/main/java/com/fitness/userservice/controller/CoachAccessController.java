package com.fitness.userservice.controller;

import com.fitness.userservice.service.TrainingRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Service-to-service endpoint; intentionally not routed through the gateway.
@RestController
@RequestMapping("/internal/coach-access")
@RequiredArgsConstructor
public class CoachAccessController {
    private final TrainingRequestService service;

    @GetMapping
    public ResponseEntity<Boolean> hasAccess(
            @RequestParam String coachId, @RequestParam String traineeId) {
        return ResponseEntity.ok(service.hasCoachAccess(coachId, traineeId));
    }
}
