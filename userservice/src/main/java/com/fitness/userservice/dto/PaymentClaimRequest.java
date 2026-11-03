package com.fitness.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentClaimRequest {
    @NotBlank(message = "Payment method is required")
    private String paymentMethodId;

    @Size(max = 200)
    private String reference;
}
