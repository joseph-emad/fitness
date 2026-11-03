package com.fitness.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitness.userservice.dto.TrainingPlanDto;
import com.fitness.userservice.model.Message;
import com.fitness.userservice.model.TrainingPlan;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.repository.MessageRepository;
import com.fitness.userservice.repository.TrainingPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoachingCollaborationTest {
    @Mock
    private TrainingPlanRepository planRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private TrainingRequestService requestService;

    private TrainingPlanService planService;
    private MessageService messageService;
    private TrainingRequest request;

    @BeforeEach
    void setUp() {
        planService = new TrainingPlanService(planRepository, requestService, new ObjectMapper());
        messageService = new MessageService(messageRepository, requestService);
        request = new TrainingRequest();
        request.setTraineeId("trainee");
        request.setCoachId("coach");
        request.setStatus(TrainingRequestStatus.ACCEPTED);
        lenient().when(requestService.findForParticipant("r1", "coach")).thenReturn(request);
        lenient().when(requestService.findForParticipant("r1", "trainee")).thenReturn(request);
        lenient().when(planRepository.save(any(TrainingPlan.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void coachSavesPlanAndRoundTripsContent() {
        TrainingPlanDto saved = planService.save("r1", "coach", plan());

        assertEquals("Strength", saved.getTitle());
        assertEquals("Squat", saved.getWeeks().get(0).getDays().get(0).getExercises().get(0).getName());
    }

    @Test
    void traineeCannotEditPlan() {
        assertStatus(HttpStatus.FORBIDDEN, () -> planService.save("r1", "trainee", plan()));
    }

    @Test
    void planCannotBeSavedWhenCoachingEnded() {
        request.setStatus(TrainingRequestStatus.CANCELLED);

        assertStatus(HttpStatus.CONFLICT, () -> planService.save("r1", "coach", plan()));
    }

    @Test
    void missingPlanIsNotFound() {
        when(planRepository.findByRequestId("r1")).thenReturn(Optional.empty());

        assertStatus(HttpStatus.NOT_FOUND, () -> planService.get("r1", "trainee"));
    }

    @Test
    void participantSendsMessage() {
        assertEquals("trainee", messageService.send("r1", "trainee", " hi ").getSenderId());
    }

    @Test
    void messagesRejectedWhenCoachingEnded() {
        request.setStatus(TrainingRequestStatus.DECLINED);

        assertStatus(HttpStatus.CONFLICT, () -> messageService.send("r1", "coach", "hi"));
    }

    private TrainingPlanDto plan() {
        TrainingPlanDto.Exercise exercise = new TrainingPlanDto.Exercise();
        exercise.setName("Squat");
        TrainingPlanDto.Day day = new TrainingPlanDto.Day();
        day.setExercises(List.of(exercise));
        TrainingPlanDto.Week week = new TrainingPlanDto.Week();
        week.setDays(List.of(day));
        TrainingPlanDto dto = new TrainingPlanDto();
        dto.setTitle("Strength");
        dto.setWeeks(List.of(week));
        return dto;
    }

    private void assertStatus(HttpStatus status, org.junit.jupiter.api.function.Executable executable) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, executable);
        assertEquals(status, e.getStatusCode());
    }
}
