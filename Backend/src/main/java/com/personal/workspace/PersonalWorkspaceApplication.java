package com.personal.workspace;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PersonalWorkspaceApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(PersonalWorkspaceApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File[] files = { new java.io.File(".env"), new java.io.File("Backend/.env") };
        for (java.io.File file : files) {
            if (file.exists() && file.isFile()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                            int eq = line.indexOf('=');
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {}
                break;
            }
        }
    }

    @Bean
    public CommandLineRunner cleanupCheckConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Direct drop for H2 auto-generated check constraint
                String[] candidates = {"CONSTRAINT_A", "CONSTRAINT_B", "CONSTRAINT_C", "CONSTRAINT_D", "TASK_RESOURCES_RESOURCE_TYPE_CHECK"};
                for (String c : candidates) {
                    try {
                        jdbcTemplate.execute("ALTER TABLE task_resources DROP CONSTRAINT IF EXISTS " + c);
                    } catch (Exception ignored) {}
                }

                try {
                    java.util.List<String> checkConstraints = jdbcTemplate.queryForList(
                        "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CONSTRAINTS WHERE UPPER(TABLE_NAME) = 'TASK_RESOURCES'",
                        String.class
                    );
                    for (String constraintName : checkConstraints) {
                        if (constraintName.startsWith("CONSTRAINT_") || constraintName.toUpperCase().contains("CHECK")) {
                            try {
                                jdbcTemplate.execute("ALTER TABLE task_resources DROP CONSTRAINT IF EXISTS " + constraintName);
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception ignored) {}
            } catch (Exception e) {
                // Ignore
            }
        };
    }
}
