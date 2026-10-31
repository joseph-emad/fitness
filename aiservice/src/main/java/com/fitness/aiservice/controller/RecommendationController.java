package com.fitness.aiservice.controller;

import com.fitness.aiservice.model.Recommendation;
import com.fitness.aiservice.service.CoachAccessService;
import com.fitness.aiservice.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;
    private final CoachAccessService coachAccessService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Recommendation>> getUserRecommendations(
            @PathVariable String userId,
            @RequestHeader("X-User-ID") String authenticatedUserId) {
        String owner = coachAccessService.resolveOwner(authenticatedUserId, userId);
        return ResponseEntity.ok(recommendationService.getUserRecommendation(owner));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<Recommendation> getActivityRecommendations(
            @PathVariable String activityId,
            @RequestHeader("X-User-ID") String authenticatedUserId,
            @RequestParam(required = false) String traineeId) {
        return ResponseEntity.ok(recommendationService.getActivityRecommendation(
                activityId, coachAccessService.resolveOwner(authenticatedUserId, traineeId)));
    }
}
 