package com.fitness.aiservice.controller;

import com.fitness.aiservice.service.RecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class RecommendationControllerTest {
    @Test
    void recommendationListRejectsAnotherUsersSubject() {
        RecommendationService recommendationService = mock(RecommendationService.class);
        RecommendationController controller = new RecommendationController(recommendationService);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.getUserRecommendations("someone-else", "authenticated-user"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verifyNoInteractions(recommendationService);
    }
}
