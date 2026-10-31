package com.fitness.aiservice.config;

import org.springframework.cloud.client.loadbalancer.reactive.ReactorLoadBalancerExchangeFilterFunction;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public WebClient userServiceWebClient(ReactorLoadBalancerExchangeFilterFunction loadBalancer) {
        return WebClient.builder()
                .baseUrl("http://USER-SERVICE")
                .filter(loadBalancer)
                .build();
    }
}
