package com.fitness.activityservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CoachAccessService {

    private final WebClient userServiceWebClient;

    // Returns the user whose data should be read: the caller, or an accepted trainee of the caller.
    public String resolveOwner(String callerId, String traineeId) {
        if (traineeId == null || traineeId.isBlank() || traineeId.equals(callerId)) {
            return callerId;
        }
        Boolean allowed;
        try {
            allowed = userServiceWebClient.get()
                    .uri(uri -> uri.path("/internal/coach-access")
                            .queryParam("coachId", callerId)
                            .queryParam("traineeId", traineeId)
                            .build())
                    .retrieve()
                    .bodyToMono(Boolean.class)
                    .block();
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to verify coach access");
        }
        if (!Boolean.TRUE.equals(allowed)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        return traineeId;
    }
}
