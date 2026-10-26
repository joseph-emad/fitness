package com.fitness.userservice.service;

import com.fitness.userservice.model.User;
import com.fitness.userservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
}
