package com.edutrack.backend.auth.repository;

import com.edutrack.backend.auth.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    java.util.List<UserAccount> findAllByOrderByCreatedAtDesc();

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByItNumberIgnoreCase(String itNumber);

    java.util.List<UserAccount> findByRoleIgnoreCase(String role);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByItNumberIgnoreCase(String itNumber);

    boolean existsByItNumberIgnoreCaseAndIdNot(String itNumber, Long id);
}
