package com.fitness.activityservice.service;

import com.fitness.activityservice.dto.ActivityRequest;
import com.fitness.activityservice.model.Activity;
import com.fitness.activityservice.outbox.ActivityOutboxEvent;
import com.fitness.activityservice.outbox.ActivityOutboxRepository;
import com.fitness.events.ActivityEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityPersistenceService {
    private final ActivityRepository activityRepository;
    private final ActivityOutboxRepository outboxRepository;

    @Transactional
    public Activity persistActivity(ActivityRequest request) {
        Activity activity = Activity.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .duration(request.getDuration())
                .caloriesBurned(request.getCaloriesBurned())
                .startTime(request.getStartTime())
                .exercises(request.getExercises())
                .additionalMetrics(request.getAdditionalMetrics())
                .build();
        Activity savedActivity = activityRepository.save(activity);
        ActivityEvent event = new ActivityEvent(UUID.randomUUID().toString(), savedActivity);
        outboxRepository.save(ActivityOutboxEvent.pending(event, Instant.now()));
        return savedActivity;
    }
}
