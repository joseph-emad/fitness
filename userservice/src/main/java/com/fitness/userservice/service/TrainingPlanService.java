package com.fitness.userservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitness.userservice.dto.TrainingPlanDto;
import com.fitness.userservice.model.TrainingPlan;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.repository.TrainingPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingPlanService {
    private final TrainingPlanRepository planRepository;
    private final TrainingRequestService requestService;
    private final ObjectMapper objectMapper;

    public TrainingPlanDto save(String requestId, String coachId, TrainingPlanDto dto) {
        TrainingRequest request = requestService.findForParticipant(requestId, coachId);
        if (!request.getCoachId().equals(coachId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the coach can edit the plan");
        }
        if (request.getStatus() != TrainingRequestStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Coaching is not active");
        }
        TrainingPlan plan = planRepository.findByRequestId(requestId).orElseGet(TrainingPlan::new);
        plan.setRequestId(requestId);
        plan.setTitle(dto.getTitle().trim());
        plan.setNotes(dto.getNotes());
        try {
            plan.setContent(objectMapper.writeValueAsString(dto.getWeeks()));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan");
        }
        return toDto(planRepository.save(plan));
    }

    public TrainingPlanDto get(String requestId, String userId) {
        TrainingRequest request = requestService.findForParticipant(requestId, userId);
        if (request.getCoachId().equals(userId) || requestService.isPlanUnlocked(request)) {
            return planRepository.findByRequestId(requestId).map(this::toDto)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No plan yet"));
        }
        throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment is required to view the plan");
    }

    private TrainingPlanDto toDto(TrainingPlan plan) {
        TrainingPlanDto dto = new TrainingPlanDto();
        dto.setTitle(plan.getTitle());
        dto.setNotes(plan.getNotes());
        dto.setUpdatedAt(plan.getUpdatedAt());
        try {
            dto.setWeeks(objectMapper.readValue(plan.getContent(),
                    new TypeReference<List<TrainingPlanDto.Week>>() { }));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stored plan is corrupt");
        }
        return dto;
    }
}
