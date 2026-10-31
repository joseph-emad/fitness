package com.fitness.userservice.controller;

import com.fitness.userservice.dto.TrainingRequestCreate;
import com.fitness.userservice.dto.TrainingRequestResponse;
import com.fitness.userservice.service.TrainingRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/training-requests")
@RequiredArgsConstructor
public class TrainingRequestController {
    private final TrainingRequestService service;

    @PostMapping
    public ResponseEntity<TrainingRequestResponse> create(
            @Valid @RequestBody TrainingRequestCreate request,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId, request));
    }

    @GetMapping("/sent")
    public ResponseEntity<List<TrainingRequestResponse>> sent(@RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.getSent(userId));
    }

    @GetMapping("/received")
    public ResponseEntity<List<TrainingRequestResponse>> received(@RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.getReceived(userId));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<TrainingRequestResponse> accept(
            @PathVariable String id, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.accept(id, userId));
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<TrainingRequestResponse> decline(
            @PathVariable String id, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.decline(id, userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<TrainingRequestResponse> cancel(
            @PathVariable String id, @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(service.cancel(id, userId));
    }
}
