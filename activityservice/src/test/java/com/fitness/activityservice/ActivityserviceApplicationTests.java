package com.fitness.activityservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "outbox.publisher.enabled=false",
        "spring.mongodb.uri=mongodb://localhost:27017/fitnessactivity",
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "rabbitmq.queue.name=activity.queue",
        "rabbitmq.exchange.name=fitness.exchange",
        "rabbitmq.routing.key=activity.tracking"
})
class ActivityserviceApplicationTests {

    @Test
    void contextLoads() {
    }

}
