package com.fitness.userservice.repository;

import com.fitness.userservice.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, String> {
    List<PaymentMethod> findByCoachId(String coachId);

    long countByCoachId(String coachId);
}
