package com.fitness.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8181/realms/fitness-oauth2",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8181/realms/fitness-oauth2/protocol/openid-connect/certs"
})
class GatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
