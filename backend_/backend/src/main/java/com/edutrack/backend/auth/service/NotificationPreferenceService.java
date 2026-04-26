package com.edutrack.backend.auth.service;

import com.edutrack.backend.auth.dto.NotificationPreferencesResponse;
import com.edutrack.backend.auth.dto.UpdateNotificationPreferencesRequest;
import com.edutrack.backend.auth.entity.NotificationPreference;
import com.edutrack.backend.auth.repository.NotificationPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationPreferenceService {

    @Autowired
    private NotificationPreferenceRepository repository;

    // ✅ ENTITY-BASED METHODS (keep for DB)

    public List<NotificationPreference> getPreferencesListByEmail(String email) {
        return repository.findByUserAccount_Email(email);
    }

    public NotificationPreference savePreference(NotificationPreference pref) {
        return repository.save(pref);
    }

    public NotificationPreferencesResponse updatePreferences(UpdateNotificationPreferencesRequest request) {

    Map<String, Boolean> prefs = request.preferences(); // ✅ correct way

    return new NotificationPreferencesResponse(request.email(), prefs);
}

    public void deletePreference(Long id) {
        repository.deleteById(id);
    }

    // ✅ DTO-BASED METHODS (for UI)

    public NotificationPreferencesResponse getPreferences(String email) {

        Map<String, Boolean> prefs = defaultPreferenceMap();

        return new NotificationPreferencesResponse(email, prefs);
    }

    
    public List<String> getSupportedCategories() {
        return List.of(
                "bookingUpdates",
                "maintenanceAlerts",
                "systemAnnouncements",
                "securityNotices"
        );
    }

    // ✅ ADD THIS (MISSING METHOD)
    private Map<String, Boolean> defaultPreferenceMap() {
        Map<String, Boolean> defaults = new HashMap<>();
        defaults.put("bookingUpdates", true);
        defaults.put("maintenanceAlerts", true);
        defaults.put("systemAnnouncements", true);
        defaults.put("securityNotices", true);
        return defaults;
    }
}