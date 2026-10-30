package com.fitness.activityservice.service;

import com.fitness.activityservice.dto.ActivityRequest;
import com.fitness.activityservice.dto.ActivityResponse;
import com.fitness.activityservice.model.Activity;
import com.fitness.activityservice.model.ActivityType;
import com.fitness.activityservice.model.Exercise;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserValidationService userValidationService;
    private final ActivityPersistenceService activityPersistenceService;

    public ActivityResponse trackActivity(ActivityRequest request) {
        validateExercises(request);

        boolean isValidUser = userValidationService.validateUser(request.getUserId());
        if(!isValidUser){
            throw new RuntimeException("Invalid User: " + request.getUserId());
        }

        Activity savedActivity = activityPersistenceService.persistActivity(request);
        return mapToResponse(savedActivity);
    }

    private ActivityResponse mapToResponse(Activity activity){
        ActivityResponse response = new ActivityResponse();
        response.setId(activity.getId());
        response.setUserId(activity.getUserId());
        response.setType(activity.getType());
        response.setDuration(activity.getDuration());
        response.setCaloriesBurned(activity.getCaloriesBurned());
        response.setStartTime(activity.getStartTime());
        response.setExercises(activity.getExercises());
        response.setAdditionalMetrics(activity.getAdditionalMetrics());
        response.setCreatedAt(activity.getCreatedAt());
        response.setUpdatedAt(activity.getUpdatedAt());
        return response;
    }

    private void validateExercises(ActivityRequest request) {
        if (request.getType() != ActivityType.WEIGHT_TRAINING) {
            return;
        }
        if (request.getExercises() == null || request.getExercises().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Weight training requires at least one exercise");
        }
        for (Exercise exercise : request.getExercises()) {
            if (exercise == null || exercise.getName() == null || exercise.getName().isBlank()
                    || exercise.getSets() == null || exercise.getSets() < 1
                    || exercise.getReps() == null || exercise.getReps() < 1
                    || exercise.getWeightKg() == null || exercise.getWeightKg() < 0
                    || exercise.getRestSeconds() == null || exercise.getRestSeconds() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each exercise requires a name, positive sets and reps, a non-negative weight, and non-negative rest time");
            }
        }
    }

    public List<ActivityResponse> getUserActivities(String userId) {
        List<Activity> activities = activityRepository.findByUserId(userId);
        return activities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityResponse getActivityById(String activityId, String userId) {
        return activityRepository.findByIdAndUserId(activityId, userId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Activity not found"));
    }
}
