package com.mysillydreams.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import java.util.List;

/**
 * Configuration properties for API Gateway with validation
 * Provides type-safe configuration binding with JSR-303 validation
 */
@Data
@Validated
@RefreshScope
@ConfigurationProperties(prefix = "gateway")
public class GatewayProperties {

    @Valid
    @NotNull
    private Timeout timeout = new Timeout();

    @Valid
    @NotNull
    private Fallback fallback = new Fallback();

    @Valid
    @NotNull
    private Cors cors = new Cors();

    /**
     * Timeout configuration with validation
     */
    @Data
    @Validated
    public static class Timeout {
        
        /**
         * Global request timeout (ISO-8601 duration format, e.g., PT30S)
         */
        @NotNull
        private Duration globalRequestTimeout = Duration.ofSeconds(30);

        /**
         * Per-route timeout (ISO-8601 duration format, e.g., PT15S)
         */
        @NotNull
        private Duration perRouteTimeout = Duration.ofSeconds(15);
    }

    /**
     * Fallback configuration with validation
     */
    @Data
    @Validated
    public static class Fallback {
        
        /**
         * Retry after duration (ISO-8601 format, e.g., PT30S)
         */
        @NotNull
        private Duration retryAfter = Duration.ofSeconds(30);

        /**
         * Human-readable retry after message
         */
        @NotBlank
        private String retryAfterMessage = "30 seconds";

        /**
         * Support contact information
         */
        @NotBlank
        private String supportContact = "support@mysillydreams.com";

        /**
         * Whether to expose internal error details (should be false in production)
         */
        private boolean exposeDetails = false;

        /**
         * Error message for service unavailable responses
         */
        @NotBlank
        private String errorMessage = "Service Unavailable";

        /**
         * Suffix for unavailable service messages
         */
        @NotBlank
        private String unavailableSuffix = " is temporarily unavailable";
    }

    /**
     * CORS configuration with validation and refresh support
     */
    @Data
    @Validated
    public static class Cors {
        
        /**
         * Allowed origin patterns (can be refreshed at runtime)
         */
        @NotNull
        private List<String> allowedOriginPatterns = List.of("https://*.mysillydreams.com");

        /**
         * Allowed methods
         */
        @NotNull
        private List<String> allowedMethods = List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        );

        /**
         * Allowed headers
         */
        @NotNull
        private List<String> allowedHeaders = List.of(
            "Authorization", "Content-Type", "X-Correlation-ID", "X-XSRF-TOKEN"
        );

        /**
         * Whether credentials are allowed
         */
        private boolean allowCredentials = true;

        /**
         * Max age for preflight requests (in seconds)
         */
        @Positive
        private int maxAge = 3600;
    }
}
