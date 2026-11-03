package com.fitness.userservice.service;

import com.fitness.userservice.dto.PaymentClaimRequest;
import com.fitness.userservice.dto.TrainingRequestCreate;
import com.fitness.userservice.dto.TrainingRequestResponse;
import com.fitness.userservice.model.PaymentMethod;
import com.fitness.userservice.model.PaymentStatus;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.PaymentMethodRepository;
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
    private final PaymentMethodRepository paymentMethodRepository;

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
        request.setGoal(create.getGoal() == null ? null : create.getGoal().trim());
        request.setMessage(create.getMessage() == null ? null : create.getMessage().trim());
        if (coach.getCoachPriceCents() != null && coach.getCoachPriceCents() > 0) {
            request.setPriceCents(coach.getCoachPriceCents());
            request.setCurrency(coach.getCurrency() == null ? "USD" : coach.getCurrency());
            request.setPaymentStatus(PaymentStatus.UNPAID);
        }
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

    // Returns the request if the caller is its trainee or coach; otherwise 404.
    public TrainingRequest findForParticipant(String requestId, String userId) {
        return requestRepository.findById(requestId)
                .filter(r -> r.getTraineeId().equals(userId) || r.getCoachId().equals(userId))
                .orElseThrow(this::notFound);
    }

    // Trainee says they paid outside the app using one of the coach's methods.
    public TrainingRequestResponse claimPayment(String requestId, String traineeId, PaymentClaimRequest claim) {
        TrainingRequest request = requestRepository.findById(requestId)
                .filter(r -> r.getTraineeId().equals(traineeId))
                .orElseThrow(this::notFound);
        requireAccepted(request);
        if (paymentStatusOf(request) != PaymentStatus.UNPAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No payment is due for this request");
        }
        PaymentMethod method = paymentMethodRepository.findById(claim.getPaymentMethodId())
                .filter(m -> m.getCoachId().equals(request.getCoachId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown payment method"));
        request.setPaymentMethodId(method.getId());
        request.setPaymentReference(claim.getReference() == null ? null : claim.getReference().trim());
        request.setPaymentStatus(PaymentStatus.PENDING_CONFIRMATION);
        return toResponse(requestRepository.save(request));
    }

    public TrainingRequestResponse confirmPayment(String requestId, String coachId) {
        return answerPayment(requestId, coachId, PaymentStatus.PAID);
    }

    public TrainingRequestResponse rejectPayment(String requestId, String coachId) {
        return answerPayment(requestId, coachId, PaymentStatus.UNPAID);
    }

    // False only when the trainee still owes an unconfirmed payment.
    public boolean isPlanUnlocked(TrainingRequest request) {
        PaymentStatus status = paymentStatusOf(request);
        return status == PaymentStatus.NOT_REQUIRED || status == PaymentStatus.PAID;
    }

    private TrainingRequestResponse answerPayment(String requestId, String coachId, PaymentStatus result) {
        TrainingRequest request = requestRepository.findById(requestId)
                .filter(r -> r.getCoachId().equals(coachId))
                .orElseThrow(this::notFound);
        requireAccepted(request);
        if (paymentStatusOf(request) != PaymentStatus.PENDING_CONFIRMATION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No payment is awaiting confirmation");
        }
        request.setPaymentStatus(result);
        if (result == PaymentStatus.UNPAID) {
            request.setPaymentMethodId(null);
            request.setPaymentReference(null);
        }
        return toResponse(requestRepository.save(request));
    }

    private void requireAccepted(TrainingRequest request) {
        if (request.getStatus() != TrainingRequestStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Coaching is not active");
        }
    }

    private PaymentStatus paymentStatusOf(TrainingRequest request) {
        return request.getPaymentStatus() == null ? PaymentStatus.NOT_REQUIRED : request.getPaymentStatus();
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
        response.setGoal(request.getGoal());
        response.setMessage(request.getMessage());
        response.setPriceCents(request.getPriceCents());
        response.setCurrency(request.getCurrency());
        response.setPaymentStatus(paymentStatusOf(request));
        response.setPaymentMethodId(request.getPaymentMethodId());
        response.setPaymentReference(request.getPaymentReference());
        if (request.getPaymentMethodId() != null) {
            paymentMethodRepository.findById(request.getPaymentMethodId())
                    .ifPresent(m -> response.setPaymentMethodLabel(m.getLabel()));
        }
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
