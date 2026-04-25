package com.edutrack.backend.auth.repository;

import com.edutrack.backend.auth.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    List<NotificationPreference> findByUserAccountId(Long userId);
}
