package com.fitness.userservice.controller;

import com.fitness.userservice.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class UserControllerTest {
    @Test
    void profileRequestForAnotherSubjectIsNotFound() {
        UserService userService = mock(UserService.class);
        UserController controller = new UserController(userService);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.getUserProfile("someone-else", "authenticated-user"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verifyNoInteractions(userService);
    }
}
