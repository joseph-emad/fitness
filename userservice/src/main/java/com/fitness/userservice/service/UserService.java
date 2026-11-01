package com.fitness.userservice.service;

import com.fitness.userservice.dto.RegisterRequest;
import com.fitness.userservice.dto.UserResponse;
import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
    private final UserRepository repository;

    public UserResponse register( RegisterRequest request) {

        if (repository.existsByEmail(request.getEmail())){
            User existing = repository.findByEmail(request.getEmail());
            // Keep the row linked to the current Keycloak account (e.g. after the Keycloak user was recreated)
            if (request.getKeycloakId() != null && !request.getKeycloakId().equals(existing.getKeycloakId())) {
                existing.setKeycloakId(request.getKeycloakId());
                existing = repository.save(existing);
            }
            return toResponse(existing);
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setKeycloakId(request.getKeycloakId());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        return toResponse(repository.save(user));
    }

    public UserResponse getUserProfile(String keycloakId) {
        return toResponse(findByKeycloakId(keycloakId));
    }

    public UserResponse chooseRole(String keycloakId, UserRole role) {
        if (role != UserRole.USER && role != UserRole.COACH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be USER or COACH");
        }
        User user = findByKeycloakId(keycloakId);
        if (user.getRole() == UserRole.ADMIN || Boolean.TRUE.equals(user.getRoleChosen())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Role has already been chosen");
        }
        user.setRole(role);
        user.setRoleChosen(true);
        return toResponse(repository.save(user));
    }

    public List<UserResponse> getCoaches() {
        return repository.findByRole(UserRole.COACH).stream()
                .map(this::toResponse)
                .toList();
    }

    public Boolean existByUserId(String userId) {
        log.info("Calling User Validation API for userId: {}", userId);
        return repository.existsByKeycloakId(userId);
    }

    private User findByKeycloakId(String keycloakId) {
        return repository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setKeycloakId(user.getKeycloakId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole() == null ? UserRole.USER : user.getRole());
        response.setRoleChosen(Boolean.TRUE.equals(user.getRoleChosen()));
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
