package com.edutrack.backend.auth.dto;

import com.edutrack.backend.auth.entity.UserAccount;

import java.time.LocalDateTime;

public record AdminUserDto(
        Long id,
        String fullName,
        String itNumber,
        String email,
        String role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AdminUserDto fromEntity(UserAccount userAccount) {
        return new AdminUserDto(
                userAccount.getId(),
                userAccount.getFullName(),
                userAccount.getItNumber(),
                userAccount.getEmail(),
                userAccount.getRole(),
                userAccount.getCreatedAt(),
                userAccount.getUpdatedAt()
        );
    }
}
