package com.fitness.userservice.controller;

import com.fitness.userservice.dto.MessageCreate;
import com.fitness.userservice.dto.MessageResponse;
import com.fitness.userservice.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService service;

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<MessageResponse>> list(
            @PathVariable String requestId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime after,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.list(requestId, userId, after));
    }

    @PostMapping("/request/{requestId}")
    public ResponseEntity<MessageResponse> send(
            @PathVariable String requestId,
            @Valid @RequestBody MessageCreate message,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.send(requestId, userId, message.getContent()));
    }
}
