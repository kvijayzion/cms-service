package com.mysillydreams.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Configuration properties for distributed tracing
 * Provides type-safe configuration binding with JSR-303 validation
 */
@Data
@Validated
@RefreshScope
@Component
@ConfigurationProperties(prefix = "tracing")
public class TracingProperties {

    /**
     * Whether tracing is enabled
     */
    private boolean enabled = true;

    /**
     * Paths to exclude from full tracing (supports Ant patterns)
     * These endpoints will skip span creation but still pass through
     */
    @NotNull
    @NotEmpty
    private List<String> excludePaths = List.of(
        "/actuator/**",
        "/fallback/**", 
        "/error",
        "/health",
        "/status",
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/webjars/**"
    );

    /**
     * Whether to tag spans with correlation ID
     */
    private boolean correlationIdTagging = true;

    /**
     * Whether to tag spans with user information
     */
    private boolean userInfoTagging = true;

    /**
     * Whether to sanitize paths in span names to avoid high cardinality
     */
    private boolean pathSanitization = true;

    /**
     * Whether to use W3C trace context headers
     */
    private boolean w3cTraceContext = true;

    /**
     * Whether to add custom trace headers (X-Trace-Id, X-Span-Id)
     */
    private boolean customTraceHeaders = true;

    /**
     * Validate exclude paths patterns at startup
     */
    @PostConstruct
    public void validateExcludePaths() {
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
