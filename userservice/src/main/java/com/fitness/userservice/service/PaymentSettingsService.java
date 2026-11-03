package com.fitness.userservice.service;

import com.fitness.userservice.dto.PaymentMethodDto;
import com.fitness.userservice.dto.PricingRequest;
import com.fitness.userservice.model.PaymentMethod;
import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.PaymentMethodRepository;
import com.fitness.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PaymentSettingsService {
    private static final int MAX_METHODS = 10;

    private final UserRepository userRepository;
    private final PaymentMethodRepository methodRepository;

    public PricingRequest setPricing(String coachId, PricingRequest pricing) {
        User coach = requireCoach(coachId);
        Long price = pricing.getPriceCents() == null || pricing.getPriceCents() == 0 ? null : pricing.getPriceCents();
        coach.setCoachPriceCents(price);
        coach.setCurrency(pricing.getCurrency().toUpperCase(Locale.ROOT));
        userRepository.save(coach);
        PricingRequest saved = new PricingRequest();
        saved.setPriceCents(price);
        saved.setCurrency(coach.getCurrency());
        return saved;
    }

    public List<PaymentMethodDto> list(String coachId) {
        requireCoach(coachId);
        return methodRepository.findByCoachId(coachId).stream().map(PaymentSettingsService::toDto).toList();
    }

    public PaymentMethodDto add(String coachId, PaymentMethodDto dto) {
        requireCoach(coachId);
        if (methodRepository.countByCoachId(coachId) >= MAX_METHODS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Too many payment methods");
        }
        PaymentMethod method = new PaymentMethod();
        method.setCoachId(coachId);
        method.setType(dto.getType());
        method.setLabel(dto.getLabel().trim());
        method.setInstructions(dto.getInstructions() == null ? null : dto.getInstructions().trim());
        return toDto(methodRepository.save(method));
    }

    public void delete(String coachId, String methodId) {
        PaymentMethod method = methodRepository.findById(methodId)
                .filter(m -> m.getCoachId().equals(coachId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment method not found"));
        methodRepository.delete(method);
    }

    private User requireCoach(String coachId) {
        return userRepository.findByKeycloakId(coachId)
                .filter(u -> u.getRole() == UserRole.COACH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only coaches can do this"));
    }

    static PaymentMethodDto toDto(PaymentMethod method) {
        PaymentMethodDto dto = new PaymentMethodDto();
        dto.setId(method.getId());
        dto.setType(method.getType());
        dto.setLabel(method.getLabel());
        dto.setInstructions(method.getInstructions());
        return dto;
    }
}
