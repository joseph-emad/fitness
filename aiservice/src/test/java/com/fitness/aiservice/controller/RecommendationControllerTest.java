package com.fitness.aiservice.controller;

import com.fitness.aiservice.service.CoachAccessService;
import com.fitness.aiservice.service.RecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RecommendationControllerTest {
    private final RecommendationService recommendationService = mock(RecommendationService.class);
    private final CoachAccessService coachAccessService = mock(CoachAccessService.class);
    private final RecommendationController controller =
            new RecommendationController(recommendationService, coachAccessService);

    @Test
    void recommendationListRejectsUsersWithoutCoachAccess() {
        when(coachAccessService.resolveOwner("authenticated-user", "someone-else"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.getUserRecommendations("someone-else", "authenticated-user"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verifyNoInteractions(recommendationService);
    }

    @Test
    void acceptedCoachReadsTraineeRecommendations() {
        when(coachAccessService.resolveOwner("coach", "trainee")).thenReturn("trainee");
        when(recommendationService.getUserRecommendation("trainee")).thenReturn(List.of());

        assertEquals(HttpStatus.OK, controller.getUserRecommendations("trainee", "coach").getStatusCode());
        verify(recommendationService).getUserRecommendation("trainee");
    }
}
