package com.fitness.aiservice.service;

import com.fitness.aiservice.model.Activity;
import com.fitness.aiservice.model.Recommendation;
import com.fitness.aiservice.repository.RecommendationRepository;
import com.fitness.events.ActivityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActivityMessageListener {

    private final ActivityAIService aiService;
    private final RecommendationRepository recommendationRepository;

    @RabbitListener(queues = "activity.queue")
    public void processActivity(ActivityEvent event) {
        Activity activity = event.getActivity();
        if (activity == null || activity.getId() == null) {
            throw new IllegalArgumentException("Activity event must include an identified activity");
        }
        if (recommendationRepository.findByActivityId(activity.getId()).isPresent()) {
            log.info("Recommendation already exists for activity {}; ignoring duplicate event", activity.getId());
            return;
        }
        log.info("Received activity for processing: {}", activity.getId());
        Recommendation recommendation = aiService.generateRecommendation(activity);
        recommendationRepository.save(recommendation);

    }
}
