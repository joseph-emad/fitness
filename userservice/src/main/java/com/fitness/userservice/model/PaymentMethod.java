package com.fitness.userservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "payment_methods")
@Data
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Keycloak subject ID of the coach
    @Column(nullable = false)
    private String coachId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType type;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(length = 500)
    private String instructions;
}
