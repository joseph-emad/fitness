package com.fitness.userservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// ddl-auto=update never changes existing constraints, so databases created before the COACH role
// still carry a CHECK that only allows USER and ADMIN.
@Component
@RequiredArgsConstructor
@Slf4j
public class RoleConstraintMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } catch (RuntimeException e) {
            log.warn("Could not drop users_role_check: {}", e.getMessage());
        }
    }
}
