package com.fitness.userservice.dto;

import com.fitness.userservice.model.PaymentMethodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentMethodDto {
    private String id;

    @NotNull(message = "Type is required")
    private PaymentMethodType type;

    @NotBlank(message = "Label is required")
    @Size(max = 100)
    private String label;

    @Size(max = 500)
    private String instructions;
}
