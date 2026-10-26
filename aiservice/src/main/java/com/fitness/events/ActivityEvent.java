package com.fitness.events;

import com.fitness.aiservice.model.Activity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEvent {
    private String eventId;
    private Activity activity;
}
