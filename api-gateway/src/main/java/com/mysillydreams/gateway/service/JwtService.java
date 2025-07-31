package com.mysillydreams.gateway.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Clock;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
// import io.jsonwebtoken.impl.DefaultClock; // Using public API instead
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;

/**
 * JWT token validation service for API Gateway
 */
@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey jwtSecretKey;
    private final SecretKey jwtRefreshSecretKey;
    private final Clock clock;
    private final String expectedIssuer;
    private final String expectedAudience;
    private final Duration clockSkew;

    // Constructor with security enhancements
    public JwtService(
            @Value("${jwt.secret:#{environment.JWT_SECRET ?: 'LocalJwtSecretKeyForDevelopmentMinimum256BitsLong123456789!'}}") String jwtSecret,
            @Value("${jwt.issuer:api-gateway}") String expectedIssuer,
            @Value("${jwt.audience:mysillydreams-api}") String expectedAudience,
            @Value("${jwt.clock-skew:PT60S}") Duration clockSkew
    ) {
        // Load from environment variable or secure vault, not application.yml
        String secretKey = System.getenv("JWT_SECRET") != null ? System.getenv("JWT_SECRET") : jwtSecret;

        this.jwtSecretKey = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        this.jwtRefreshSecretKey = Keys.hmacShaKeyFor((secretKey + "_refresh").getBytes(StandardCharsets.UTF_8));
        this.clock = () -> new Date(); // Use lambda instead of DefaultClock.INSTANCE
        this.expectedIssuer = expectedIssuer;
        this.expectedAudience = expectedAudience;
        this.clockSkew = clockSkew;

        logger.info("JwtService initialized with issuer: {}, audience: {}, clockSkew: {}",
                   expectedIssuer, expectedAudience, clockSkew);
    }

    private SecretKey getSigningKey() {
        return jwtSecretKey;
    }

    /**
     * Validate JWT token with issuer, audience, and clock skew validation
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .setClock(clock)
                    .setAllowedClockSkewSeconds(clockSkew.getSeconds())
                    .requireIssuer(expectedIssuer)
                    .requireAudience(expectedAudience)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Additional validation can be added here
            return true;
        } catch (JwtException e) {
            logger.debug("JWT validation failed: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            logger.warn("Unexpected error during JWT validation: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract user ID from JWT token
     */
    public String extractUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Try to get userId from claims, fallback to subject if not present
            String userId = claims.get("userId", String.class);
            return userId != null ? userId : claims.getSubject();
        } catch (Exception e) {
            logger.debug("Failed to extract user ID from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extract username from JWT token
     */
    public String extractUsername(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Username is typically stored in the subject
            return claims.getSubject();
        } catch (Exception e) {
            logger.debug("Failed to extract username from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extract roles from JWT token
     */
    public String extractRoles(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Roles are typically stored in authorities claim
            String authorities = claims.get("authorities", String.class);
            return authorities != null ? authorities : "";
        } catch (Exception e) {
            logger.debug("Failed to extract roles from token: {}", e.getMessage());
            return "";
        }
    }



    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim from token
     */
    public String extractClaim(String token, String claimName) {
        Claims claims = extractAllClaims(token);
        return claims.get(claimName, String.class);
    }

    /**
     * Extract claim using function
     */
    public <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from token with validation
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setClock(clock)
                .setAllowedClockSkewSeconds(clockSkew.getSeconds())
                .requireIssuer(expectedIssuer)
                .requireAudience(expectedAudience)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if user has admin role
     */
    public boolean hasAdminRole(String token) {
        String roles = extractRoles(token);
        return roles.contains("ROLE_ADMIN") || roles.contains("admin");
    }

    /**
     * Check if user has specific role
     */
    public boolean hasRole(String token, String role) {
        String roles = extractRoles(token);
        return roles.contains(role);
    }
}
