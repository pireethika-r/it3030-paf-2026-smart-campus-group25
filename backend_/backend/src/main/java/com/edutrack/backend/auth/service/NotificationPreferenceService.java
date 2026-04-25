package com.edutrack.backend.auth.service;

import com.edutrack.backend.auth.dto.NotificationPreferencesResponse;
import com.edutrack.backend.auth.dto.UpdateNotificationPreferencesRequest;
import com.edutrack.backend.auth.entity.NotificationPreference;
import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.exception.AuthException;
import com.edutrack.backend.auth.repository.NotificationPreferenceRepository;
import com.edutrack.backend.auth.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class NotificationPreferenceService {

    public static final String BOOKING_UPDATES = "BOOKING_UPDATES";
    public static final String MAINTENANCE_ALERTS = "MAINTENANCE_ALERTS";
    public static final String SYSTEM_ANNOUNCEMENTS = "SYSTEM_ANNOUNCEMENTS";
    public static final String SECURITY_NOTICES = "SECURITY_NOTICES";

    private static final List<String> CATEGORIES = List.of(
            BOOKING_UPDATES,
            MAINTENANCE_ALERTS,
            SYSTEM_ANNOUNCEMENTS,
            SECURITY_NOTICES
    );

    private final UserAccountRepository userAccountRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;

    public NotificationPreferenceService(
            UserAccountRepository userAccountRepository,
            NotificationPreferenceRepository notificationPreferenceRepository
    ) {
        this.userAccountRepository = userAccountRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesResponse getPreferencesByEmail(String email) {
        UserAccount userAccount = resolveUserByEmail(email);

        Map<String, Boolean> result = defaultPreferenceMap();
        for (NotificationPreference preference : notificationPreferenceRepository.findByUserAccountId(userAccount.getId())) {
            result.put(preference.getCategory(), preference.isEnabled());
        }

        return new NotificationPreferencesResponse(userAccount.getEmail(), result);
    }

    @Transactional
    public NotificationPreferencesResponse updatePreferences(UpdateNotificationPreferencesRequest request) {
        UserAccount userAccount = resolveUserByEmail(request.email());
        Map<String, Boolean> requestedMap = request.preferences();

        if (requestedMap.isEmpty()) {
            throw new AuthException("At least one notification preference is required");
        }

        for (String category : requestedMap.keySet()) {
            String normalizedCategory = normalizeCategory(category);
            if (!CATEGORIES.contains(normalizedCategory)) {
                throw new AuthException("Unsupported notification category: " + category);
            }
        }

        Map<String, NotificationPreference> existingByCategory = new LinkedHashMap<>();
        for (NotificationPreference preference : notificationPreferenceRepository.findByUserAccountId(userAccount.getId())) {
            existingByCategory.put(preference.getCategory(), preference);
        }

        List<NotificationPreference> toSave = new java.util.ArrayList<>();
        for (Map.Entry<String, Boolean> entry : requestedMap.entrySet()) {
            String category = normalizeCategory(entry.getKey());
            boolean enabled = Boolean.TRUE.equals(entry.getValue());

            NotificationPreference preference = existingByCategory.get(category);
            if (preference == null) {
                preference = new NotificationPreference();
                preference.setUserAccount(userAccount);
                preference.setCategory(category);
            }
            preference.setEnabled(enabled);
            toSave.add(preference);
        }

        notificationPreferenceRepository.saveAll(toSave);
        return getPreferencesByEmail(userAccount.getEmail());
    }

    public List<String> getSupportedCategories() {
        return CATEGORIES;
    }

    private UserAccount resolveUserByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        return userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AuthException("User not found for email: " + normalizedEmail));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCategory(String category) {
        return category == null ? "" : category.trim().toUpperCase(Locale.ROOT);
    }

    private Map<String, Boolean> defaultPreferenceMap() {
        Map<String, Boolean> defaults = new LinkedHashMap<>();
        for (String category : CATEGORIES) {
            defaults.put(category, true);
        }
        return defaults;
    }
}
