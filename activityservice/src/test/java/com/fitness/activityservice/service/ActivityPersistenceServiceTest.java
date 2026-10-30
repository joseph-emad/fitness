package com.fitness.activityservice.service;

import com.fitness.activityservice.dto.ActivityRequest;
import com.fitness.activityservice.model.Activity;
import com.fitness.activityservice.model.Exercise;
import com.fitness.activityservice.outbox.ActivityOutboxEvent;
import com.fitness.activityservice.outbox.ActivityOutboxRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityPersistenceServiceTest {
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private ActivityOutboxRepository outboxRepository;
    @InjectMocks
    private ActivityPersistenceService persistenceService;

    @Test
    void storesActivityAndMatchingPendingEventInTheSameWriteService() {
        ActivityRequest request = new ActivityRequest();
        request.setUserId("owner-1");
        request.setDuration(25);
        request.setCaloriesBurned(175);
        request.setExercises(java.util.List.of(new Exercise("Squat", 4, 8, 60.5, 90)));
        Activity savedActivity = Activity.builder()
                .id("activity-1")
                .userId("owner-1")
                .duration(25)
                .caloriesBurned(175)
                .exercises(request.getExercises())
                .build();
        when(activityRepository.save(any(Activity.class))).thenReturn(savedActivity);

        Activity result = persistenceService.persistActivity(request);

        assertEquals("activity-1", result.getId());
        ArgumentCaptor<ActivityOutboxEvent> eventCaptor =
                ArgumentCaptor.forClass(ActivityOutboxEvent.class);
        InOrder writeOrder = inOrder(activityRepository, outboxRepository);
        writeOrder.verify(activityRepository).save(any(Activity.class));
        writeOrder.verify(outboxRepository).save(eventCaptor.capture());
        ActivityOutboxEvent event = eventCaptor.getValue();
        assertEquals(ActivityOutboxEvent.Status.PENDING, event.getStatus());
        assertEquals("activity-1", event.getPayload().getActivity().getId());
        assertEquals("owner-1", event.getPayload().getActivity().getUserId());
        assertEquals(request.getExercises(), event.getPayload().getActivity().getExercises());
        verify(outboxRepository).save(event);
    }
}
