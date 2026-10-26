package com.fitness.aiservice.service;

import com.fitness.aiservice.model.Activity;
import com.fitness.aiservice.model.Recommendation;
import com.fitness.aiservice.repository.RecommendationRepository;
import com.fitness.events.ActivityEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityMessageListenerTest {
    @Mock
    private ActivityAIService aiService;
    @Mock
    private RecommendationRepository recommendationRepository;
    @InjectMocks
    private ActivityMessageListener listener;

    @Test
    void duplicateDeliveryDoesNotGenerateOrSaveAnotherRecommendation() {
        Activity activity = new Activity();
        activity.setId("activity-1");
        ActivityEvent event = new ActivityEvent("event-1", activity);
        when(recommendationRepository.findByActivityId("activity-1"))
                .thenReturn(Optional.of(Recommendation.builder().activityId("activity-1").build()));

        listener.processActivity(event);

        verify(aiService, never()).generateRecommendation(activity);
        verify(recommendationRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void firstDeliveryGeneratesAndStoresARecommendation() {
        Activity activity = new Activity();
        activity.setId("activity-1");
        ActivityEvent event = new ActivityEvent("event-1", activity);
        Recommendation recommendation = Recommendation.builder()
                .id("activity-1")
                .activityId("activity-1")
                .build();
        when(recommendationRepository.findByActivityId("activity-1")).thenReturn(Optional.empty());
        when(aiService.generateRecommendation(activity)).thenReturn(recommendation);

        listener.processActivity(event);

        verify(recommendationRepository).save(recommendation);
    }
}
