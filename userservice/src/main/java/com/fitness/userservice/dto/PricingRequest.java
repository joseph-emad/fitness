package com.fitness.userservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PricingRequest {
    // Null or 0 means free coaching
    @Min(value = 0, message = "Price cannot be negative")
    @Max(value = 100_000_000, message = "Price is too high")
    private Long priceCents;

    @Pattern(regexp = "[A-Za-z]{3}", message = "Currency must be a 3-letter code")
    private String currency = "USD";
}
