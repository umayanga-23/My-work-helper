package com.personal.workspace.config;

import com.personal.workspace.entity.CategoryEntity;
import com.personal.workspace.entity.CategoryType;
import com.personal.workspace.entity.UserEntity;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    public static final UUID ADMIN_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    public static final UUID USER_CHAMATHKA_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking & Initializing Multi-User Workspace Accounts...");

        // 1. Initialize or Update Super Admin (Induwara)
        if (userRepository.findById(ADMIN_USER_ID).isEmpty()) {
            UserEntity admin = new UserEntity(
                    ADMIN_USER_ID,
                    "AIUAdmin",
                    "induwaraumayangaz04@gmail.com",
                    passwordEncoder.encode("Azind2003#"),
                    "Induwara Umayanga",
                    "ROLE_ADMIN"
            );
            userRepository.save(admin);
            log.info("✅ Super Admin Account Initialized: AIUAdmin (induwaraumayangaz04@gmail.com)");
        } else {
            log.info("ℹ Super Admin Account verified: AIUAdmin");
        }

        // 2. Initialize Chamathka's Private Account
        if (userRepository.findById(USER_CHAMATHKA_ID).isEmpty()) {
            UserEntity chamathka = new UserEntity(
                    USER_CHAMATHKA_ID,
                    "ChamathkaR",
                    "rjklcr003@gmail.com",
                    passwordEncoder.encode("Rjkl003@CR"),
                    "Chamathka",
                    "ROLE_USER"
            );
            userRepository.save(chamathka);
            log.info("✅ Private User Account Initialized: ChamathkaR (rjklcr003@gmail.com)");

            // Seed starter categories for Chamathka's workspace
            seedStarterCategories(USER_CHAMATHKA_ID);
        } else {
            log.info("ℹ Private User Account verified: ChamathkaR");
        }

        log.info("Multi-User Workspace Security Initialized Successfully.");
    }

    private void seedStarterCategories(UUID userId) {
        List<CategoryEntity> categories = List.of(
                new CategoryEntity(userId, "Personal", CategoryType.TASK, "#10B981", "User"),
                new CategoryEntity(userId, "Work & Study", CategoryType.TASK, "#3B82F6", "Briefcase"),
                new CategoryEntity(userId, "Important", CategoryType.TASK, "#EF4444", "AlertCircle"),
                new CategoryEntity(userId, "Daily Routine", CategoryType.TASK, "#8B5CF6", "Calendar"),
                new CategoryEntity(userId, "General Notes", CategoryType.NOTE, "#F59E0B", "FileText"),
                new CategoryEntity(userId, "Study Resources", CategoryType.DOCUMENT, "#06B6D4", "Folder")
        );
        categoryRepository.saveAll(categories);
        log.info("🌱 Seeded initial starter categories for user: {}", userId);
    }
}
