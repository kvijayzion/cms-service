package com.mysillydreams.gateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.constants.HeaderConstants;
import com.mysillydreams.gateway.dto.ErrorResponse;
import com.mysillydreams.gateway.logging.SanitizingLoggerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Abstract base class for error handlers providing common error response functionality
 * Eliminates code duplication between CustomAuthenticationEntryPoint and CustomAccessDeniedHandler
 */
public abstract class AbstractErrorHandler {

    private static final Logger logger = LoggerFactory.getLogger(AbstractErrorHandler.class);

    protected final ObjectMapper objectMapper;
    protected final String realm;
    protected final SanitizingLoggerInterceptor loggingInterceptor;

    protected AbstractErrorHandler(ObjectMapper objectMapper, String realm) {
        this.objectMapper = objectMapper;
        this.realm = realm != null ? realm : "api";
        // Create a default sanitizing logger interceptor if not provided
        this.loggingInterceptor = new SanitizingLoggerInterceptor(new SecurityErrorFormatter());
    }

    protected AbstractErrorHandler(ObjectMapper objectMapper, String realm,
                                  SanitizingLoggerInterceptor loggingInterceptor) {
        this.objectMapper = objectMapper;
        this.realm = realm != null ? realm : "api";
        this.loggingInterceptor = loggingInterceptor;
    }

    /**
     * Write error response to the client with proper reactive handling
     */
    protected Mono<Void> writeError(ServerWebExchange exchange, ErrorResponse errorResponse) {
        ServerHttpResponse response = exchange.getResponse();
        
        // Set response status
        response.setStatusCode(HttpStatus.valueOf(errorResponse.getStatus()));
        
        // Set headers before committing response
        response.beforeCommit(() -> {
            setErrorHeaders(response, errorResponse);
            return Mono.empty();
        });

        return
            // JSON serialization in bounded elastic scheduler to avoid blocking Netty event loop
            Mono.fromCallable(() -> objectMapper.writeValueAsBytes(errorResponse))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(bytes -> {
                    DataBuffer buffer = response.bufferFactory().wrap(bytes);
                    return response.writeWith(Mono.just(buffer))
                            .doOnError(error -> {
                                // Release buffer on error to prevent memory leaks
                                DataBufferUtils.release(buffer);
                            });
                })
                .onErrorResume(ex -> {
                    // Enhanced fallback error logging
                    logFallbackFailure("JSON serialization failed for error response", ex, errorResponse.getCorrelationId());

                    // Enhanced fallback with complete ErrorResponse shape
                    String fallback = createFallbackJson(errorResponse);
                    DataBuffer buffer = response.bufferFactory().wrap(fallback.getBytes(StandardCharsets.UTF_8));
                    return response.writeWith(Mono.just(buffer))
                            .doOnError(fallbackError -> {
                                // Release buffer if fallback also fails
                                DataBufferUtils.release(buffer);
                                logFallbackFailure("Fallback JSON response failed", fallbackError, errorResponse.getCorrelationId());
                            });
                });
    }

    /**
     * Set common error response headers
     */
    private void setErrorHeaders(ServerHttpResponse response, ErrorResponse errorResponse) {
        // Content type with explicit charset
        response.getHeaders().setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
        
        // Cache control
        response.getHeaders().set(HeaderConstants.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        
        // Correlation ID if present
        if (errorResponse.getCorrelationId() != null) {
            response.getHeaders().set(HeaderConstants.X_CORRELATION_ID, errorResponse.getCorrelationId());
        }
        
        // WWW-Authenticate header for 401 responses with configurable realm
        if (errorResponse.getStatus() == 401) {
            response.getHeaders().set("WWW-Authenticate", String.format("Bearer realm=\"%s\"", realm));
        }
        
        // Retry-After header if present
        if (errorResponse.getRetryAfter() != null) {
            response.getHeaders().set(HeaderConstants.RETRY_AFTER, errorResponse.getRetryAfter());
        }
    }

    /**
     * Extract correlation ID from request headers
     */
    protected String getCorrelationId(ServerWebExchange exchange) {
        return exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);
    }

    /**
     * Extract user ID from request headers (set by authentication filter)
     */
    protected String getUserId(ServerWebExchange exchange) {
        return exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USER_ID);
    }

    /**
     * Extract username from request headers (set by authentication filter)
     */
    protected String getUsername(ServerWebExchange exchange) {
        return exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USERNAME);
    }

    /**
     * Extract user roles from request headers (set by authentication filter)
     */
    protected String getUserRoles(ServerWebExchange exchange) {
        return exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USER_ROLES);
    }

    /**
     * Get request path for error response
     */
    protected String getRequestPath(ServerWebExchange exchange) {
        return exchange.getRequest().getPath().value();
    }

    /**
     * Create base error response with common fields
     */
    protected ErrorResponse createBaseErrorResponse(String error, String message, int status, 
                                                   String path, String correlationId) {
        return ErrorResponse.builder()
                .error(error)
                .message(message)
                .status(status)
                .path(path)
                .correlationId(correlationId)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    /**
     * Create fallback JSON response with complete ErrorResponse structure and proper escaping
     */
    private String createFallbackJson(ErrorResponse errorResponse) {
        return String.format(
            "{\"error\":\"%s\",\"message\":\"%s\",\"status\":%d,\"path\":\"%s\",\"correlationId\":\"%s\",\"timestamp\":\"%s\",\"retryAfter\":\"%s\",\"supportContact\":\"%s\",\"category\":\"%s\"}",
            escapeJsonString(errorResponse.getError()),
            escapeJsonString(errorResponse.getMessage()),
            errorResponse.getStatus(),
            escapeJsonString(errorResponse.getPath()),
            escapeJsonString(errorResponse.getCorrelationId()),
            OffsetDateTime.now(ZoneOffset.UTC).toString(),
            escapeJsonString(errorResponse.getRetryAfter()),
            escapeJsonString(errorResponse.getSupportContact()),
            escapeJsonString(errorResponse.getCategory())
        );
    }

    /**
     * Safe string conversion with JSON escaping to prevent injection and malformed JSON
     */
    private String escapeJsonString(String value) {
        if (value == null) {
            return "";
        }

        // Escape special JSON characters to prevent injection and malformed JSON
        return value.replace("\\", "\\\\")  // Escape backslashes first
                   .replace("\"", "\\\"")   // Escape quotes
                   .replace("\n", "\\n")    // Escape newlines
                   .replace("\r", "\\r")    // Escape carriage returns
                   .replace("\t", "\\t")    // Escape tabs
                   .replace("\b", "\\b")    // Escape backspace
                   .replace("\f", "\\f");   // Escape form feed
    }

    /**
     * Centralized helper to determine if logging should occur based on status code
     */
    private boolean shouldLog(int status) {
        return (status >= 500 && logger.isErrorEnabled()) ||
               (status == 401 && logger.isWarnEnabled()) ||
               (status < 500 && status != 401 && logger.isInfoEnabled());
    }

    /**
     * Enhanced error logging with sanitizing interceptor and intelligent level selection
     */
    protected void logError(String message, int status, String correlationId, Throwable ex) {
        if (!shouldLog(status)) {
            return; // Skip expensive operations if logging is disabled
        }

        // Set MDC for structured logging
        try {
            if (correlationId != null) {
                MDC.put("correlationId", correlationId);
            }
            MDC.put("httpStatus", String.valueOf(status));

            // Use sanitizing logger interceptor for early sanitization
            if (status >= 500) {
                loggingInterceptor.logError(logger, message, ex);
            } else if (status == 401 || status == 403) {
                // Use WARN for authentication/authorization failures (expected errors)
                loggingInterceptor.logWarn(logger, message);
            } else {
                loggingInterceptor.logInfo(logger, message);
            }
        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.remove("correlationId");
            MDC.remove("httpStatus");
        }
    }

    /**
     * Global log message sanitization to remove sensitive information
     */
    private String sanitizeLogMessage(String message) {
        if (message == null) {
            return "";
        }

        // Remove sensitive patterns from log messages
        return message.replaceAll("(?i)(password|token|secret|key|credential|authorization|bearer)\\s*[=:]\\s*[^\\s,;]+", "$1=[REDACTED]")
                     .replaceAll("(?i)(authorization|bearer)\\s+[^\\s,;]+", "$1 [REDACTED]")
                     .replaceAll("(?i)\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "[EMAIL_REDACTED]") // Email addresses
                     .substring(0, Math.min(message.length(), 1000)); // Limit message length
    }

    /**
     * Log error with appropriate level based on status code (without exception)
     */
    protected void logError(String message, int status, String correlationId) {
        logError(message, status, correlationId, null);
    }

    /**
     * Enhanced logging with user context for better traceability
     */
    protected void logErrorWithUserContext(String message, int status, String correlationId,
                                          String userId, String username, Throwable ex) {
        logErrorWithUserContextAndRoles(message, status, correlationId, userId, username, null, ex);
    }

    /**
     * Enhanced logging with user context and roles for comprehensive traceability
     * Includes sensitive data sanitization and logging level checks
     */
    protected void logErrorWithUserContextAndRoles(String message, int status, String correlationId,
                                                   String userId, String username, String roles, Throwable ex) {
        if (!shouldLog(status)) {
            return; // Skip expensive operations if logging is disabled
        }

        try {
            // Set comprehensive MDC context with sanitized values
            if (correlationId != null) {
                MDC.put("correlationId", correlationId);
            }
            if (userId != null) {
                MDC.put("userId", sanitizeUserId(userId));
            }
            if (username != null) {
                MDC.put("username", sanitizeUsername(username));
            }
            if (roles != null) {
                MDC.put("userRoles", sanitizeRoles(roles));
            }
            MDC.put("httpStatus", String.valueOf(status));

            // Create comprehensive user context string with sanitized values
            String userContext = String.format("User: %s (ID: %s, Roles: %s)",
                                              sanitizeUsername(username),
                                              sanitizeUserId(userId),
                                              sanitizeRoles(roles));
            String enhancedMessage = message + " - " + userContext;

            logError(enhancedMessage, status, correlationId, ex);
        } finally {
            // Comprehensive MDC cleanup to prevent memory leaks
            MDC.remove("correlationId");
            MDC.remove("userId");
            MDC.remove("username");
            MDC.remove("userRoles");
            MDC.remove("httpStatus");
        }
    }

    /**
     * Sanitize username for logging to prevent sensitive data exposure
     */
    private String sanitizeUsername(String username) {
        if (username == null) {
            return "anonymous";
        }

        // Remove potential sensitive patterns and limit length
        String sanitized = username.replaceAll("(?i)(password|token|secret|key)", "[REDACTED]")
                                  .replaceAll("[^a-zA-Z0-9@._-]", "")
                                  .substring(0, Math.min(username.length(), 50));

        return sanitized.isEmpty() ? "anonymous" : sanitized;
    }

    /**
     * Sanitize user ID for logging
     */
    private String sanitizeUserId(String userId) {
        if (userId == null) {
            return "unknown";
        }

        // Keep only alphanumeric characters and common ID separators
        String sanitized = userId.replaceAll("[^a-zA-Z0-9-_]", "")
                                .substring(0, Math.min(userId.length(), 36));

        return sanitized.isEmpty() ? "unknown" : sanitized;
    }

    /**
     * Sanitize roles for logging
     */
    private String sanitizeRoles(String roles) {
        if (roles == null) {
            return "unknown";
        }

        // Keep only alphanumeric characters, commas, and underscores for roles
        String sanitized = roles.replaceAll("[^a-zA-Z0-9,_]", "")
                               .substring(0, Math.min(roles.length(), 100));

        return sanitized.isEmpty() ? "unknown" : sanitized;
    }

    /**
     * Log fallback failures for monitoring and debugging
     */
    private void logFallbackFailure(String message, Throwable error, String correlationId) {
        try {
            if (correlationId != null) {
                MDC.put("correlationId", correlationId);
            }
            MDC.put("errorType", "fallback_failure");

            // Use sanitizing logger for fallback failure logging
            loggingInterceptor.logError(logger, "Error response fallback failure: " + message, error);
        } finally {
            MDC.remove("correlationId");
            MDC.remove("errorType");
        }
    }
}
