package com.fitness.userservice.service;

import com.fitness.userservice.dto.TrainingRequestCreate;
import com.fitness.userservice.dto.TrainingRequestResponse;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.TrainingRequestRepository;
import com.fitness.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TrainingRequestService {
    private static final Set<TrainingRequestStatus> ACTIVE =
            Set.of(TrainingRequestStatus.PENDING, TrainingRequestStatus.ACCEPTED);

    private final TrainingRequestRepository requestRepository;
    private final UserRepository userRepository;

    public TrainingRequestResponse create(String traineeId, TrainingRequestCreate create) {
        String coachId = create.getCoachId();
        if (coachId.equals(traineeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot request yourself");
        }
        User trainee = findUser(traineeId);
        if (trainee.getRole() == UserRole.COACH) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only trainees can send training requests");
        }
        User coach = userRepository.findByKeycloakId(coachId)
                .filter(user -> user.getRole() == UserRole.COACH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));
        if (requestRepository.existsByTraineeIdAndCoachIdAndStatusIn(traineeId, coachId, ACTIVE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A request with this coach is already active");
        }

        TrainingRequest request = new TrainingRequest();
        request.setTraineeId(traineeId);
        request.setCoachId(coach.getKeycloakId());
        request.setMessage(create.getMessage() == null ? null : create.getMessage().trim());
        return toResponse(requestRepository.save(request));
    }

    public List<TrainingRequestResponse> getSent(String traineeId) {
        return requestRepository.findByTraineeIdOrderByCreatedAtDesc(traineeId).stream()
                .map(this::toResponse).toList();
    }

    public List<TrainingRequestResponse> getReceived(String coachId) {
        return requestRepository.findByCoachIdOrderByCreatedAtDesc(coachId).stream()
                .map(this::toResponse).toList();
    }

    public TrainingRequestResponse accept(String requestId, String coachId) {
        return decide(requestId, coachId, TrainingRequestStatus.ACCEPTED);
    }

    public TrainingRequestResponse decline(String requestId, String coachId) {
        return decide(requestId, coachId, TrainingRequestStatus.DECLINED);
    }

    public TrainingRequestResponse cancel(String requestId, String traineeId) {
        TrainingRequest request = requestRepository.findById(requestId)
                .filter(r -> r.getTraineeId().equals(traineeId))
                .orElseThrow(this::notFound);
        if (!ACTIVE.contains(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is no longer active");
        }
        request.setStatus(TrainingRequestStatus.CANCELLED);
        return toResponse(requestRepository.save(request));
    }

    public boolean hasCoachAccess(String coachId, String traineeId) {
        return requestRepository.existsByTraineeIdAndCoachIdAndStatus(
                traineeId, coachId, TrainingRequestStatus.ACCEPTED);
    }

    private TrainingRequestResponse decide(String requestId, String coachId, TrainingRequestStatus status) {
        TrainingRequest request = requestRepository.findById(requestId)
                .filter(r -> r.getCoachId().equals(coachId))
                .orElseThrow(this::notFound);
        if (request.getStatus() != TrainingRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request has already been answered");
        }
        request.setStatus(status);
        return toResponse(requestRepository.save(request));
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Training request not found");
    }

    private User findUser(String keycloakId) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private TrainingRequestResponse toResponse(TrainingRequest request) {
        TrainingRequestResponse response = new TrainingRequestResponse();
        response.setId(request.getId());
        response.setTraineeId(request.getTraineeId());
        response.setCoachId(request.getCoachId());
        response.setMessage(request.getMessage());
        response.setStatus(request.getStatus());
        response.setCreatedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());
        userRepository.findByKeycloakId(request.getTraineeId()).ifPresent(user -> {
            response.setTraineeName(displayName(user));
            response.setTraineeEmail(user.getEmail());
        });
        userRepository.findByKeycloakId(request.getCoachId()).ifPresent(user -> {
            response.setCoachName(displayName(user));
            response.setCoachEmail(user.getEmail());
        });
        return response;
    }

    private String displayName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
