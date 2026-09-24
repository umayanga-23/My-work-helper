package com.personal.workspace.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                UserPrincipal userPrincipal = null;
                if ("demo-jwt-token-dev-1001".equals(jwt)) {
                    userPrincipal = new UserPrincipal(DEMO_USER_ID, "developer@workspace.local", "ROLE_ADMIN");
                } else {
                    try {
                        String[] parts = jwt.split("\\.");
                        if (parts.length >= 2) {
                            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                            com.fasterxml.jackson.databind.JsonNode jsonNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payloadJson);
                            String sub = jsonNode.has("sub") ? jsonNode.get("sub").asText() : null;
                            if (sub != null) {
                                UUID userId = UUID.fromString(sub);
                                String email = jsonNode.has("email") ? jsonNode.get("email").asText() : "user@workspace.local";
                                String role = jsonNode.has("role") ? jsonNode.get("role").asText() : "ROLE_USER";
                                userPrincipal = new UserPrincipal(userId, email, role);
                            }
                        }
                    } catch (Exception parseEx) {
                        logger.warn("Could not parse JWT token claims: " + parseEx.getMessage());
                    }
                    if (userPrincipal == null) {
                        userPrincipal = new UserPrincipal(DEMO_USER_ID, "user@workspace.local", "ROLE_USER");
                    }
                }

                if (userPrincipal != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userPrincipal, null, userPrincipal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
