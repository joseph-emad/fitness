package com.fitness.userservice.dto;

import com.fitness.userservice.model.UserRole;
import lombok.Data;

@Data
public class RoleRequest {
    private UserRole role;
}
