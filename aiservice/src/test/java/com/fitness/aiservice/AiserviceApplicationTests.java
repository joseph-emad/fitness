package com.fitness.aiservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "spring.mongodb.uri=mongodb://localhost:27017/fitnessrecommendation",
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "rabbitmq.queue.name=activity.queue",
        "rabbitmq.exchange.name=fitness.exchange",
        "rabbitmq.routing.key=activity.tracking",
        "gemini.api.url=https://example.invalid/gemini?key=",
        "gemini.api.key="
})
class AiserviceApplicationTests {

    @Test
    void contextLoads() {
    }

}
