package com.fitness.userservice.service;

import com.fitness.userservice.dto.TrainingRequestCreate;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.TrainingRequestRepository;
import com.fitness.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainingRequestServiceTest {
    @Mock
    private TrainingRequestRepository requestRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private TrainingRequestService service;

    private User trainee;
    private User coach;

    @BeforeEach
    void setUp() {
        trainee = user("trainee", UserRole.USER);
        coach = user("coach", UserRole.COACH);
        lenient().when(userRepository.findByKeycloakId("trainee")).thenReturn(Optional.of(trainee));
        lenient().when(userRepository.findByKeycloakId("coach")).thenReturn(Optional.of(coach));
        lenient().when(requestRepository.save(any(TrainingRequest.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void traineeCreatesPendingRequestForCoach() {
        var response = service.create("trainee", create("coach"));

        assertEquals(TrainingRequestStatus.PENDING, response.getStatus());
        assertEquals("coach", response.getCoachId());
    }

    @Test
    void requestToNonCoachIsNotFound() {
        when(userRepository.findByKeycloakId("other")).thenReturn(Optional.of(user("other", UserRole.USER)));

        assertStatus(HttpStatus.NOT_FOUND, () -> service.create("trainee", create("other")));
    }

    @Test
    void duplicateActiveRequestIsConflict() {
        when(requestRepository.existsByTraineeIdAndCoachIdAndStatusIn(any(), any(), any())).thenReturn(true);

        assertStatus(HttpStatus.CONFLICT, () -> service.create("trainee", create("coach")));
    }

    @Test
    void coachAcceptsPendingRequest() {
        when(requestRepository.findById("r1")).thenReturn(Optional.of(pending()));

        assertEquals(TrainingRequestStatus.ACCEPTED, service.accept("r1", "coach").getStatus());
    }

    @Test
    void otherCoachCannotAnswerRequest() {
        when(requestRepository.findById("r1")).thenReturn(Optional.of(pending()));

        assertStatus(HttpStatus.NOT_FOUND, () -> service.decline("r1", "intruder"));
    }

    @Test
    void answeredRequestCannotBeAnsweredAgain() {
        TrainingRequest request = pending();
        request.setStatus(TrainingRequestStatus.DECLINED);
        when(requestRepository.findById("r1")).thenReturn(Optional.of(request));

        assertStatus(HttpStatus.CONFLICT, () -> service.accept("r1", "coach"));
    }

    @Test
    void traineeCancelsAcceptedRequest() {
        TrainingRequest request = pending();
        request.setStatus(TrainingRequestStatus.ACCEPTED);
        when(requestRepository.findById("r1")).thenReturn(Optional.of(request));

        assertEquals(TrainingRequestStatus.CANCELLED, service.cancel("r1", "trainee").getStatus());
    }

    private TrainingRequest pending() {
        TrainingRequest request = new TrainingRequest();
        request.setId("r1");
        request.setTraineeId("trainee");
        request.setCoachId("coach");
        return request;
    }

    private TrainingRequestCreate create(String coachId) {
        TrainingRequestCreate create = new TrainingRequestCreate();
        create.setCoachId(coachId);
        return create;
    }

    private User user(String keycloakId, UserRole role) {
        User user = new User();
        user.setKeycloakId(keycloakId);
        user.setEmail(keycloakId + "@example.test");
        user.setRole(role);
        return user;
    }

    private void assertStatus(HttpStatus status, org.junit.jupiter.api.function.Executable executable) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, executable);
        assertEquals(status, e.getStatusCode());
    }
}
