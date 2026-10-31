package com.fitness.userservice.service;

import com.fitness.userservice.model.User;
import com.fitness.userservice.model.UserRole;
import com.fitness.userservice.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private UserService userService;

    @Test
    void profileIsResolvedByKeycloakSubjectRatherThanDatabasePrimaryKey() {
        User user = new User();
        user.setId("database-id");
        user.setKeycloakId("keycloak-subject");
        user.setEmail("owner@example.test");
        when(userRepository.findByKeycloakId("keycloak-subject")).thenReturn(Optional.of(user));

        var profile = userService.getUserProfile("keycloak-subject");

        assertEquals("database-id", profile.getId());
        assertEquals("keycloak-subject", profile.getKeycloakId());
        verify(userRepository).findByKeycloakId("keycloak-subject");
    }

    @Test
    void roleCanBeChosenOnlyOnce() {
        User user = new User();
        user.setKeycloakId("kc");
        when(userRepository.findByKeycloakId("kc")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        var response = userService.chooseRole("kc", UserRole.COACH);

        assertEquals(UserRole.COACH, response.getRole());
        assertTrue(response.isRoleChosen());
        var error = assertThrows(ResponseStatusException.class, () -> userService.chooseRole("kc", UserRole.USER));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void adminRoleCannotBeSelfAssigned() {
        var error = assertThrows(ResponseStatusException.class, () -> userService.chooseRole("kc", UserRole.ADMIN));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
}
