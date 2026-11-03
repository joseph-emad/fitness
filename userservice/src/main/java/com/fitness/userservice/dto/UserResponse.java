package com.fitness.userservice.dto;

import com.fitness.userservice.model.UserRole;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class UserResponse {

    private String id;

    private String keycloakId;

    private String email;

//    TRIAL for REMOVING PASSWORDS from responses
//    VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//    private String password;

    private String firstName;

    private String lastName;

    private UserRole role;

    private boolean roleChosen;

    private Long coachPriceCents;

    private String currency;

    private List<PaymentMethodDto> paymentMethods = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
