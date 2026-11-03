package com.fitness.userservice.repository;

import com.fitness.userservice.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByRequestIdOrderByCreatedAtAsc(String requestId);

    List<Message> findByRequestIdAndCreatedAtAfterOrderByCreatedAtAsc(String requestId, LocalDateTime after);
}
