package com.fitness.userservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private String id;
    private String senderId;
    private String content;
    private LocalDateTime createdAt;
}
