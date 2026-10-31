package com.fitness.userservice.repository;

import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TrainingRequestRepository extends JpaRepository<TrainingRequest, String> {
    List<TrainingRequest> findByTraineeIdOrderByCreatedAtDesc(String traineeId);

    List<TrainingRequest> findByCoachIdOrderByCreatedAtDesc(String coachId);

    boolean existsByTraineeIdAndCoachIdAndStatusIn(
            String traineeId, String coachId, Collection<TrainingRequestStatus> statuses);

    boolean existsByTraineeIdAndCoachIdAndStatus(
            String traineeId, String coachId, TrainingRequestStatus status);
}
