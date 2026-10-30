package com.fitness.gateway;

import com.fitness.gateway.user.RegisterRequest;
import com.fitness.gateway.user.UserService;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

//@Component
@Slf4j
@RequiredArgsConstructor
public class KeycloakUserSyncFilter implements WebFilter {
    private final UserService userService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (exchange.getRequest().getPath().value().startsWith("/actuator/health")) {
            return chain.filter(exchange);
        }

//        return exchange.getPrincipal()
//                .ofType(JwtAuthenticationToken.class)
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .ofType(JwtAuthenticationToken.class)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Valid Keycloak token required")))
                .flatMap(authentication -> {
                    var jwt = authentication.getToken();
                    String userId = jwt.getSubject();
                    String email = jwt.getClaimAsString("email");

                    if (userId == null || userId.isBlank()
                            || email == null || email.isBlank()) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED, "Required Keycloak claims are missing"));
                    }

                    RegisterRequest request = new RegisterRequest();
                    request.setKeycloakId(userId);
                    request.setEmail(email);
                    request.setFirstName(jwt.getClaimAsString("given_name"));
                    request.setLastName(jwt.getClaimAsString("family_name"));

                    return userService.validateUser(userId)
                            .flatMap(exists -> exists
                                    ? Mono.<Void>empty()
                                    : userService.registerUser(request).then())
                            .then(Mono.defer(() -> {
                                ServerHttpRequest securedRequest = exchange.getRequest().mutate()
                                        .headers(headers -> headers.set("X-User-ID", userId))
                                        .build();
                                return chain.filter(
                                        exchange.mutate().request(securedRequest).build());
                            }));
                });
    }

//    ORIGINAL
//    VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//    @Override
//    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain){
//        String token = exchange.getRequest().getHeaders().getFirst("Authorization");
//        String userId = exchange.getRequest().getHeaders().getFirst("X-User-ID");
//        RegisterRequest registerRequest = getUserDetails(token);
//
//        if (userId == null){
//            userId = registerRequest.getKeycloakId();
//        }
//
//        if (userId != null && token != null){
//            String finalUserId = userId;
//            return userService.validateUser(userId)
//                    .flatMap(exist -> {
//                        if(!exist){
//
//                            if (registerRequest != null) {
//                                return userService.registerUser(registerRequest)
//                                        .then(Mono.empty());
//                            } else {
//                                return Mono.empty();
//                            }
//                        } else {
//                            log.info("User already exists, Skipping sync.");
//                            return Mono.empty();
//                        }
//                    })
//                    .then(Mono.defer(() -> {
//                        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
//                                .header("X-User-ID", finalUserId)
//                                .build();
//                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
//                    }));
//        }
//        return chain.filter(exchange);
//    }

//    private RegisterRequest getUserDetails(String token) {
//        try {
//            String tokenWithoutBearer = token.replace("Bearer ", "").trim();
//            SignedJWT signedJWT = SignedJWT.parse(tokenWithoutBearer);
//            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
//
//            RegisterRequest registerRequest = new RegisterRequest();
//            registerRequest.setEmail(claims.getStringClaim("email"));
//            registerRequest.setKeycloakId(claims.getStringClaim("sub"));
////            registerRequest.setPassword("dummy@123123");
//            registerRequest.setFirstName(claims.getStringClaim("given_name"));
//            registerRequest.setLastName(claims.getStringClaim("family_name"));
//            return registerRequest;
//
//        } catch (Exception e){
//            e.printStackTrace();
//            return null;
//        }
//    }
//    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
}
