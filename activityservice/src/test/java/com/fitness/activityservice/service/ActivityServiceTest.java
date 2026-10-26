package com.fitness.activityservice.service;

import com.fitness.activityservice.dto.ActivityRequest;
import com.fitness.activityservice.model.Activity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private UserValidationService userValidationService;
    @Mock
    private ActivityPersistenceService activityPersistenceService;
    @InjectMocks
    private ActivityService activityService;

    @Test
    void trackActivityValidatesUserAndDelegatesTransactionalPersistence() {
        ActivityRequest request = new ActivityRequest();
        request.setUserId("user-1");
        request.setDuration(30);
        request.setCaloriesBurned(200);
        when(userValidationService.validateUser("user-1")).thenReturn(true);
        when(activityPersistenceService.persistActivity(request))
                .thenReturn(Activity.builder().id("activity-1").userId("user-1").build());

        var response = activityService.trackActivity(request);

        assertEquals("activity-1", response.getId());
        verify(activityPersistenceService).persistActivity(request);
    }

    @Test
    void invalidUserCannotPersistAnActivity() {
        ActivityRequest request = new ActivityRequest();
        request.setUserId("unknown-user");
        when(userValidationService.validateUser("unknown-user")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> activityService.trackActivity(request));

        verify(activityPersistenceService, never()).persistActivity(request);
    }

    @Test
    void activityLookupUsesBothResourceIdAndAuthenticatedOwner() {
        Activity activity = Activity.builder().id("activity-1").userId("owner-1").build();
        when(activityRepository.findByIdAndUserId("activity-1", "owner-1"))
                .thenReturn(java.util.Optional.of(activity));

        assertEquals("owner-1", activityService.getActivityById("activity-1", "owner-1").getUserId());
    }

    @Test
    void activityLookupDoesNotExposeAnotherUsersRecord() {
        when(activityRepository.findByIdAndUserId("activity-1", "other-user"))
                .thenReturn(java.util.Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> activityService.getActivityById("activity-1", "other-user"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}
