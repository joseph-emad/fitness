package com.fitness.activityservice.outbox;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ActivityOutboxRepository extends MongoRepository<ActivityOutboxEvent, String> {
}
