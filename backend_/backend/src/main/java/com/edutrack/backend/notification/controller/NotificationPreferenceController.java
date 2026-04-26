package com.edutrack.backend.notification.controller;

import com.edutrack.backend.auth.dto.NotificationPreferencesResponse;
import com.edutrack.backend.auth.dto.UpdateNotificationPreferencesRequest;
import com.edutrack.backend.auth.entity.NotificationPreference;
import com.edutrack.backend.auth.service.NotificationPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications/preferences")
@CrossOrigin
public class NotificationPreferenceController {

    @Autowired
    private NotificationPreferenceService service;

    // ✅ GET all preferences by email
    @GetMapping("/{email}")
public NotificationPreferencesResponse getPreferences(@PathVariable String email) {
    return service.getPreferences(email);
}

    // ✅ POST create/update one category
    @PostMapping
public ResponseEntity<NotificationPreferencesResponse> createPreferences(
        @RequestBody UpdateNotificationPreferencesRequest request) {

    return ResponseEntity.ok(
            service.updatePreferences(request)
    );
}

    @PutMapping
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
        @RequestBody UpdateNotificationPreferencesRequest request) {

    return ResponseEntity.ok(
            service.updatePreferences(request)
    );
    }

    // ✅ DELETE preference
    @DeleteMapping("/{id}")
public ResponseEntity<String> deletePreference(@PathVariable Long id) {
    service.deletePreference(id);
    return ResponseEntity.ok("Deleted successfully");
}
}