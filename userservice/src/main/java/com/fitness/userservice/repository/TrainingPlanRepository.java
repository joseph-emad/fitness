package com.fitness.userservice.repository;

import com.fitness.userservice.model.TrainingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingPlanRepository extends JpaRepository<TrainingPlan, String> {
    Optional<TrainingPlan> findByRequestId(String requestId);
}
