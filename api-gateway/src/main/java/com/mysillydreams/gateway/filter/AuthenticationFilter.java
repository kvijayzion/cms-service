package com.mysillydreams.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.constants.HeaderConstants;
import com.mysillydreams.gateway.service.JwtService;
import io.jsonwebtoken.JwtException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.annotation.NewSpan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

/**
 * Authentication filter for validating JWT tokens
 */
@Component
public class AuthenticationFilter implements GatewayFilter {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    // Use Spring's constant instead of hard-coded string

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final Tracer tracer;
    private final MeterRegistry meterRegistry;

    public AuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper, Tracer tracer, MeterRegistry meterRegistry) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.tracer = tracer;
        this.meterRegistry = meterRegistry;
    }

    @Override
    @NewSpan("gateway.authentication")
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Extract JWT token from Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // Short-circuit on missing or malformed header
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            logger.warn("Missing or invalid Authorization header for path: {}", request.getPath());

            // Record missing-header failures
            meterRegistry.counter("gateway.auth.failure",
                "path", sanitizePath(request.getPath().value()),
                "reason", "missing_or_malformed_header")
                .increment();

            return handleUnauthorized(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        return Mono.fromCallable(() -> {
            // Validate JWT token
            if (!jwtService.validateToken(token)) {
                throw new JwtException("Invalid JWT token");
            }

            // Extract user information from token
            String userId = jwtService.extractUserId(token);
            String username = jwtService.extractUsername(token);
            String roles = jwtService.extractRoles(token);

            // Validate presence of required claims with consolidated metrics
            if (userId == null || userId.trim().isEmpty()) {
                meterRegistry.counter("gateway.auth.failure",
                    "path", sanitizePath(request.getPath().value()),
                    "reason", "jwt_invalid_claim")
                    .increment();
                throw new JwtException("JWT missing required claim: userId");
            }
            if (username == null || username.trim().isEmpty()) {
                meterRegistry.counter("gateway.auth.failure",
                    "path", sanitizePath(request.getPath().value()),
                    "reason", "jwt_invalid_claim")
                    .increment();
                throw new JwtException("JWT missing required claim: username");
            }
            if (roles == null || roles.trim().isEmpty()) {
                meterRegistry.counter("gateway.auth.failure",
                    "path", sanitizePath(request.getPath().value()),
                    "reason", "jwt_invalid_claim")
                    .increment();
                throw new JwtException("JWT missing required claim: roles");
            }

            // Null-safe header writes - build request with only non-null values
            ServerHttpRequest.Builder requestBuilder = request.mutate();

            if (userId != null) {
                requestBuilder.header(HeaderConstants.X_USER_ID, userId);
            }
            if (username != null) {
                requestBuilder.header(HeaderConstants.X_USERNAME, username);
            }
            if (roles != null) {
                requestBuilder.header(HeaderConstants.X_USER_ROLES, roles);
            }
            requestBuilder.header(HeaderConstants.X_GATEWAY_VALIDATED, "true");

            ServerHttpRequest modifiedRequest = requestBuilder.build();

            logger.debug("Authentication successful for user: {} on path: {}", username, request.getPath());

            // Emit metrics counter for auth success (simplified registration)
            meterRegistry.counter("gateway.auth.success",
                "path", sanitizePath(request.getPath().value()))
                .increment();

            // Tag the span with user information
            if (tracer.currentSpan() != null) {
                if (userId != null) tracer.currentSpan().tag("user.id", userId);
                if (username != null) tracer.currentSpan().tag("user.name", username);
                if (roles != null) tracer.currentSpan().tag("user.roles", roles);
            }

            return exchange.mutate().request(modifiedRequest).build();
        })
        .subscribeOn(Schedulers.boundedElastic())  // Avoid blocking Netty event loop
        .flatMap(modifiedExchange -> {
            // Propagate user info and correlation ID into Reactor Context
            return chain.filter(modifiedExchange)
                    .contextWrite(ctx -> {
                        String userId = modifiedExchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USER_ID);
                        String username = modifiedExchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USERNAME);
                        String correlationId = modifiedExchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);

                        if (userId != null) ctx = ctx.put("user.id", userId);
                        if (username != null) ctx = ctx.put("user.name", username);
                        if (correlationId != null) ctx = ctx.put("correlationId", correlationId);

                        return ctx;
                    });
        })
        // Scope error handling to JWT exceptions only
        .onErrorResume(JwtException.class, ex -> {
            logger.warn("JWT validation failed for path: {}: {}", request.getPath(), ex.getMessage());

            // Emit metrics counter for auth failure (simplified registration)
            meterRegistry.counter("gateway.auth.failure",
                "path", sanitizePath(request.getPath().value()),
                "reason", "jwt_invalid")
                .increment();

            return handleUnauthorized(exchange, ex.getMessage());
        })
        // Map non-JWT errors to 503, not 401
        .onErrorResume(Throwable.class, ex -> {
            logger.error("Unexpected authentication error for path: {}: {}", request.getPath(), ex.getMessage());
            return handleError(exchange, HttpStatus.SERVICE_UNAVAILABLE,
                "Authentication service temporarily unavailable", ex);
        });
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange, String message) {
        return handleError(exchange, HttpStatus.UNAUTHORIZED, message, null);
    }

    /**
     * Centralized error handling method for different HTTP status codes
     */
    private Mono<Void> handleError(ServerWebExchange exchange, HttpStatus status, String message, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);

        // Set appropriate headers based on status
        if (status == HttpStatus.UNAUTHORIZED) {
            // Set WWW-Authenticate header as required by RFC 6750
            response.getHeaders().set(HttpHeaders.WWW_AUTHENTICATE, "Bearer realm=\"api\"");
        }

        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set(HeaderConstants.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

        // Add correlation ID if present
        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);
        if (correlationId != null) {
            response.getHeaders().set(HeaderConstants.X_CORRELATION_ID, correlationId);
        }

        return createErrorResponse(response, status, message, correlationId);
    }

    /**
     * Centralized error response creation with proper JSON encoding
     */
    private Mono<Void> createErrorResponse(ServerHttpResponse response, HttpStatus status, String message, String correlationId) {
        try {
            // JSON-encode the error body safely using ObjectMapper
            Map<String, Object> errorResponse = Map.of(
                "error", getErrorCode(status),
                "message", message,
                "status", status.value(),
                "correlationId", correlationId != null ? correlationId : ""
            );

            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));

        } catch (Exception e) {
            logger.error("Error creating JSON response for authentication failure", e);
            // Fallback to simple string response
            String fallbackResponse = String.format(
                "{\"error\":\"%s\",\"message\":\"%s\"}",
                getErrorCode(status),
                message
            );
            return response.writeWith(Mono.just(response.bufferFactory().wrap(fallbackResponse.getBytes())));
        }
    }

    /**
     * Get appropriate error code for HTTP status
     */
    private String getErrorCode(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> "unauthorized";
            case SERVICE_UNAVAILABLE -> "service_unavailable";
            case FORBIDDEN -> "access_denied";
            default -> "error";
        };
    }

    /**
     * Sanitize path for metrics to avoid high cardinality
     */
    private String sanitizePath(String path) {
        return path.replaceAll("/\\d+", "/{id}")
                  .replaceAll("/[a-f0-9-]{36}", "/{uuid}")
                  .replaceAll("/[a-f0-9]{8,}", "/{hash}");
    }
}
