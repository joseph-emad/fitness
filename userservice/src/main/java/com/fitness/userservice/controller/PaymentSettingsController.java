package com.fitness.userservice.controller;

import com.fitness.userservice.dto.PaymentMethodDto;
import com.fitness.userservice.dto.PricingRequest;
import com.fitness.userservice.service.PaymentSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class PaymentSettingsController {
    private final PaymentSettingsService service;

    @PutMapping("/pricing")
    public ResponseEntity<PricingRequest> setPricing(
            @Valid @RequestBody PricingRequest pricing, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.setPricing(userId, pricing));
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<List<PaymentMethodDto>> list(@RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.list(userId));
    }

    @PostMapping("/payment-methods")
    public ResponseEntity<PaymentMethodDto> add(
            @Valid @RequestBody PaymentMethodDto method, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.add(userId, method));
    }

    @DeleteMapping("/payment-methods/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @RequestHeader("X-User-ID") String userId) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
