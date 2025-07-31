package com.mysillydreams.gateway.controller;

import com.mysillydreams.gateway.constants.HeaderConstants;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
// import org.springframework.cloud.gateway.filter.factory.CircuitBreakerFilterFactory; // Not needed for fallback controller
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.springframework.web.bind.annotation.RequestMethod.*;

/**
 * Production-ready fallback controller for circuit breaker patterns
 * Provides structured error responses with logging, metrics, and externalized configuration
 */
@RestController
@RequestMapping("/fallback")
@Slf4j
@RequiredArgsConstructor
public class FallbackController {

    private final MeterRegistry meterRegistry;

    // Service mapping for consistent naming
    private static final Map<String, String> SERVICE_ID_MAP = Map.of(
            "auth", "auth-service",
            "user", "user-service",
            "admin", "admin-server",
            "config", "zookeeper-service",
            "default", "unknown"
    );

    private static final Map<String, String> HUMAN_NAME_MAP = Map.of(
            "auth", "Authentication Service",
            "user", "User Service",
            "admin", "Admin Service",
            "config", "Configuration Service",
            "default", "Downstream Service"
    );

    // Externalized fallback configuration from ZooKeeper
    @Value("${gateway.fallback.retry-after:PT30S}")
    private Duration retryAfter;

    @Value("${gateway.fallback.retry-after-message:30 seconds}")
    private String retryAfterMessage;

    @Value("${gateway.fallback.support-contact:support@mysillydreams.com}")
    private String supportContact;

    @Value("${gateway.fallback.expose-details:false}")
    private boolean exposeDetails;

    @Value("${gateway.fallback.error-message:Service Unavailable}")
    private String errorMessage;

    @Value("${gateway.fallback.unavailable-suffix: is temporarily unavailable}")
    private String unavailableSuffix;

    /**
     * Unified fallback handler for all services
     * Uses path variable with regex to guard valid service names
     */
    @RequestMapping(
            path = "/{serviceName:auth|user|admin|config|default}",
            method = {GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD},
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Mono<ResponseEntity<Map<String, Object>>> fallback(
            @PathVariable String serviceName,
            ServerWebExchange exchange
    ) {
        // Validate service name exists in our mapping
        if (!SERVICE_ID_MAP.containsKey(serviceName)) {
            log.warn("Invalid service name requested for fallback: {}", serviceName);
            return Mono.just(createNotFoundResponse(serviceName, exchange));
        }

        String serviceId = SERVICE_ID_MAP.get(serviceName);
        String humanName = HUMAN_NAME_MAP.get(serviceName);
        return Mono.just(createFallbackResponse(humanName, serviceId, exchange));
    }

    /**
     * Create standardized fallback response with proper headers, correlation ID,
     * structured logging, metrics, and circuit breaker exception details
     */
    private ResponseEntity<Map<String, Object>> createFallbackResponse(
            String serviceName,
            String serviceId,
            ServerWebExchange exchange
    ) {
        String path = exchange.getRequest().getURI().getPath();
        String correlationId = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID))
                .orElse((String) exchange.getAttribute("correlationId"));

        // Enrich MDC with correlation ID for downstream logging
        if (correlationId != null) {
            MDC.put("correlationId", correlationId);
        }

        try {
            String method = exchange.getRequest().getMethod().name();

            // Structured logging with correlation ID (now in MDC)
            log.warn("Fallback invoked for service={}, path={}, method={}", serviceId, path, method);

            // Increment fallback metrics with rich tagging for better dashboards
            Counter.builder("gateway.fallback.count")
                    .tags("service", serviceId,
                          "method", method,
                          "status", String.valueOf(HttpStatus.SERVICE_UNAVAILABLE.value()))
                    .description("Number of fallback invocations per service")
                    .register(meterRegistry)
                    .increment();

        // Build response payload
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", errorMessage);
        response.put("message", serviceName + unavailableSuffix);
        response.put("path", path);
        response.put("service", serviceId);

        // Add correlation ID if present
        if (correlationId != null) {
            response.put("correlationId", correlationId);
        }

        // Surface circuit breaker exception details if available (only in debug mode or when configured)
        Throwable cause = exchange.getAttribute("reactor.circuitBreaker.exception");
        if (cause == null) {
            // Fallback to generic exception attribute
            cause = exchange.getAttribute("org.springframework.cloud.gateway.support.ServerWebExchangeUtils.circuitBreakerException");
        }
        if (cause != null && (log.isDebugEnabled() || exposeDetails)) {
            response.put("detail", cause.getMessage());
            log.debug("Circuit breaker exception for service={}: {}", serviceId, cause.getMessage());
        }

        // Add externalized retry and support information
        response.put("retryAfter", retryAfterMessage);
        response.put("supportContact", supportContact);

        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .header(HeaderConstants.RETRY_AFTER, retryAfter.toString())  // ISO-8601 format (PT30S)
                .header(HeaderConstants.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

            // Propagate correlation ID in response headers
            if (correlationId != null) {
                responseBuilder.header(HeaderConstants.X_CORRELATION_ID, correlationId);
            }

            return responseBuilder.body(response);
        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.clear();
        }
    }

    /**
     * Create 404 response for invalid service names
     */
    private ResponseEntity<Map<String, Object>> createNotFoundResponse(
            String serviceName,
            ServerWebExchange exchange
    ) {
        String path = exchange.getRequest().getURI().getPath();
        String correlationId = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID))
                .orElse((String) exchange.getAttribute("correlationId"));

        // Enrich MDC with correlation ID
        if (correlationId != null) {
            MDC.put("correlationId", correlationId);
        }

        try {
            log.warn("Invalid fallback service requested: {}, path: {}", serviceName, path);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            response.put("status", HttpStatus.NOT_FOUND.value());
            response.put("error", "Not Found");
            response.put("message", "Fallback service '" + serviceName + "' not found");
            response.put("path", path);

            if (correlationId != null) {
                response.put("correlationId", correlationId);
            }

            ResponseEntity.BodyBuilder responseBuilder = ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HeaderConstants.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

            if (correlationId != null) {
                responseBuilder.header(HeaderConstants.X_CORRELATION_ID, correlationId);
            }

            return responseBuilder.body(response);
        } finally {
            // Clean up MDC
            MDC.clear();
        }
    }
}
