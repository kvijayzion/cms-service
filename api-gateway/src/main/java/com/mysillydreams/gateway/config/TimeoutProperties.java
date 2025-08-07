package com.mysillydreams.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Configuration properties for timeout handling with validation
 * Provides type-safe configuration binding with JSR-303 validation
 */
@Data
@Validated
@RefreshScope
@Component
@ConfigurationProperties(prefix = "gateway.timeout")
public class TimeoutProperties {

    /**
     * Global request timeout (ISO-8601 duration format)
     */
    @NotNull
    private Duration globalRequestTimeout = Duration.ofSeconds(30);

    /**
     * Per-route timeout (ISO-8601 duration format)
     */
    @NotNull
    private Duration perRouteTimeout = Duration.ofSeconds(15);

    /**
     * Retry after duration for timeout responses (ISO-8601 duration format)
     */
    @NotNull
    private Duration retryAfter = Duration.ofSeconds(30);

    /**
     * Paths to exclude from timeout handling (supports Ant patterns)
     */
    @NotNull
    @NotEmpty
    private List<String> excludePaths = List.of(
        "/actuator/**",
        "/health",
        "/fallback/**",
        "/error",
        "/status"
    );

    /**
     * Error response template for timeout scenarios
     * Supports placeholders: {timeout}, {path}, {correlationId}, {timestamp}, {retryAfter}
     */
    @NotNull
    private String errorTemplate = """
        {
          "error": "Gateway Timeout",
          "message": "The request timed out after {timeout}",
          "status": 504,
          "timestamp": "{timestamp}",
          "path": "{path}",
          "timeout": "{timeout}",
          "retryAfter": "{retryAfter}",
          "correlationId": "{correlationId}"
        }
        """;

    /**
     * Custom timeout values per path pattern
     * Key: Ant pattern, Value: timeout duration
     */
    private Map<String, Duration> customTimeouts = Map.of(
        "/api/upload/**", Duration.ofMinutes(5),
        "/api/reports/**", Duration.ofMinutes(2),
        "/api/health/**", Duration.ofSeconds(5)
    );

    /**
     * Whether to enable custom timeout metrics
     */
    private boolean metricsEnabled = true;

    /**
     * Whether to log timeout events
     */
    private boolean loggingEnabled = true;

    /**
     * Validate error template placeholders at startup
     */
    @PostConstruct
    public void validateErrorTemplate() {
        String[] requiredPlaceholders = {"{timeout}", "{path}", "{correlationId}", "{timestamp}", "{retryAfter}"};
        for (String placeholder : requiredPlaceholders) {
            if (!errorTemplate.contains(placeholder)) {
                throw new IllegalArgumentException("Error template missing required placeholder: " + placeholder);
            }
        }
    }
}
