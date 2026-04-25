package com.edutrack.backend.auth.controller;

import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.repository.UserAccountRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/oauth2")
public class OAuthController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @GetMapping("/success")
public Map<String, Object> success(@AuthenticationPrincipal OAuth2User oauthUser) {

    if (oauthUser == null) {
        throw new RuntimeException("OAuth user is null");
    }

    String email = oauthUser.getAttribute("email");
    String name = oauthUser.getAttribute("name");

    // 🔥 SAFETY FIX
    if (email == null) {
        email = "temp_" + System.currentTimeMillis() + "@gmail.com";
    }

    if (name == null) {
        name = "Google User";
    }

    Optional<UserAccount> existingUser =
            userAccountRepository.findByEmailIgnoreCase(email);

    if (existingUser.isEmpty()) {

        UserAccount newUser = new UserAccount();
        newUser.setEmail(email);
        newUser.setFullName(name);
        newUser.setRole("STUDENT");

        newUser.setItNumber("TEMP_" + System.currentTimeMillis());
        newUser.setPasswordHash("GOOGLE_LOGIN");

        userAccountRepository.save(newUser);
    }

    return oauthUser.getAttributes();

}
}