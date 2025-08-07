package com.mysillydreams.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.List;

/**
 * Configuration properties for security headers with validation
 * Provides type-safe configuration binding with JSR-303 validation
 */
@Data
@Validated
@RefreshScope
@Component
@ConfigurationProperties(prefix = "security.headers")
public class SecurityHeadersProperties {

    /**
     * Paths to exclude from security headers (supports Ant patterns)
     */
    @NotNull
    private List<String> excludePaths = List.of(
        "/actuator/**",
        "/fallback/**", 
        "/error",
        "/error-web",
        "/health",
        "/status",
        "/webjars/**"
    );

    /**
     * Content Security Policy configuration
     */
    @NotNull
    private Csp csp = new Csp();

    /**
     * HTTP Strict Transport Security configuration
     */
    @NotNull
    private Hsts hsts = new Hsts();

    /**
     * Frame options configuration
     */
    @Pattern(regexp = "DENY|SAMEORIGIN|ALLOW-FROM.*")
    private String frameOptions = "DENY";

    /**
     * Content type options configuration
     */
    @Pattern(regexp = "nosniff")
    private String contentTypeOptions = "nosniff";

    /**
     * Referrer policy configuration
     */
    @Pattern(regexp = "no-referrer|no-referrer-when-downgrade|origin|origin-when-cross-origin|same-origin|strict-origin|strict-origin-when-cross-origin|unsafe-url")
    private String referrerPolicy = "strict-origin-when-cross-origin";

    /**
     * Content Security Policy configuration
     */
    @Data
    @Validated
    public static class Csp {
        
        /**
         * Whether CSP is enabled
         */
        private boolean enabled = true;

        /**
         * Whether to use report-only mode (for development)
         */
        private boolean reportOnly = false;

        /**
         * Nonce length for CSP
         */
        @Positive
        private int nonceLength = 32;

        /**
         * CSP policy template (nonce will be injected)
         */
        @NotNull
        private String policy = "default-src 'self'; " +
                               "script-src 'self' 'nonce-%s'; " +
                               "style-src 'self' 'unsafe-inline'; " +
                               "img-src 'self' data: https:; " +
                               "font-src 'self'; " +
                               "connect-src 'self'; " +
                               "frame-ancestors 'none'; " +
                               "base-uri 'self'; " +
                               "form-action 'self'";
    }

    /**
     * HTTP Strict Transport Security configuration
     */
    @Data
    @Validated
    public static class Hsts {
        
        /**
         * Whether HSTS is enabled
         */
        private boolean enabled = true;

        /**
         * Max age in seconds
         */
        @Positive
        private long maxAge = 31536000; // 1 year

        /**
         * Whether to include subdomains
         */
        private boolean includeSubdomains = true;

        /**
         * Whether to include preload directive
         */
        private boolean preload = false;
    }

    /**
     * Validate exclude paths patterns at startup
     */
    @PostConstruct
    public void validateExcludePaths() {
        // Basic validation that paths look like valid Ant patterns
        for (String path : excludePaths) {
            if (path == null || path.trim().isEmpty()) {
                throw new IllegalArgumentException("Exclude path cannot be null or empty");
            }
            if (!path.startsWith("/")) {
                throw new IllegalArgumentException("Exclude path must start with '/': " + path);
            }
        }
    }
}
