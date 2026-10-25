package com.personal.workspace.service;

import com.personal.workspace.dto.AuthResponse;
import com.personal.workspace.dto.LoginRequest;
import com.personal.workspace.dto.ResetPasswordRequest;
import com.personal.workspace.dto.UserDTO;
import com.personal.workspace.entity.PasswordResetOtpEntity;
import com.personal.workspace.entity.UserEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.PasswordResetOtpRepository;
import com.personal.workspace.repository.UserRepository;
import com.personal.workspace.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public AuthService(UserRepository userRepository,
                       PasswordResetOtpRepository otpRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim();
        UserEntity user = userRepository.findByUsernameOrEmail(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("This account has been disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username/email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, mapToDTO(user));
    }

    public UserDTO getMe(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToDTO(user);
    }

    @Transactional
    public void requestPasswordResetOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();
        Optional<UserEntity> userOpt = userRepository.findByEmail(cleanEmail);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", cleanEmail);
            return; // Return silently to prevent email enumeration
        }

        // Generate 6-digit random numeric code
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        ZonedDateTime expiresAt = ZonedDateTime.now().plusMinutes(15);

        PasswordResetOtpEntity otpEntity = new PasswordResetOtpEntity(cleanEmail, otpCode, expiresAt);
        otpRepository.save(otpEntity);

        log.info("══════════════════════════════════════════════════════════════════");
        log.info("🔑 [PASSWORD RESET OTP] For: {} => Code: {} (Expires in 15 mins)", cleanEmail, otpCode);
        log.info("══════════════════════════════════════════════════════════════════");

        // Send via Email if mailSender is available
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(cleanEmail);
                message.setSubject("AIU Workspace — Password Reset Code");
                message.setText("Hello,\n\nYour password reset verification code is:\n\n"
                        + otpCode + "\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.");
                mailSender.send(message);
                log.info("Successfully dispatched OTP email to {}", cleanEmail);
            } catch (Exception ex) {
                log.warn("Could not send email via SMTP, logged OTP to server console: {}", ex.getMessage());
            }
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        PasswordResetOtpEntity otpEntity = otpRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP code"));

        if (otpEntity.getExpiresAt().isBefore(ZonedDateTime.now())) {
            throw new IllegalArgumentException("The OTP code has expired. Please request a new one.");
        }

        if (!otpEntity.getOtpCode().equals(request.getOtpCode().trim())) {
            throw new IllegalArgumentException("Incorrect OTP code. Please try again.");
        }

        UserEntity user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpEntity.setUsed(true);
        otpRepository.save(otpEntity);

        log.info("Password successfully updated for user: {}", cleanEmail);
    }

    private UserDTO mapToDTO(UserEntity user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAvatarUrl()
        );
    }
}
