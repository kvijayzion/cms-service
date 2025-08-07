package com.mysillydreams.gateway.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.mysillydreams.gateway.exception.InvalidErrorResponseException;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Standardized error response DTO for consistent error handling across the gateway
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    /**
     * Error code (e.g., "unauthorized", "access_denied", "invalid_token")
     */
    private String error;

    /**
     * Human-readable error message
     */
    private String message;

    /**
     * HTTP status code
     */
    private int status;

    /**
     * Timestamp when the error occurred (ISO-8601 format)
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private OffsetDateTime timestamp;

    /**
     * Request path where the error occurred
     */
    private String path;

    /**
     * Correlation ID for request tracing
     */
    private String correlationId;

    /**
     * Additional error details (optional)
     */
    private String details;

    /**
     * Error category for client handling
     */
    private String category;

    /**
     * Suggested retry after duration (for rate limiting, service unavailable)
     */
    private String retryAfter;

    /**
     * Support contact information
     */
    private String supportContact;

    /**
     * Centralized timestamp creation to ensure consistent ISO-8601 UTC formatting
     */
    private static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    /**
     * Validate error response parameters to ensure completeness with custom exception handling
     * Includes validation for message length and content
     */
    private static void validateErrorParams(String error, String message, int status) {
        if (error == null || error.trim().isEmpty()) {
            throw new InvalidErrorResponseException(
                InvalidErrorResponseException.ValidationError.NULL_ERROR_CODE,
                error
            );
        }
        if (message == null || message.trim().isEmpty()) {
            throw new InvalidErrorResponseException(
                InvalidErrorResponseException.ValidationError.NULL_MESSAGE,
                message
            );
        }

        // Validate message length to prevent excessively long error messages
        final int MAX_MESSAGE_LENGTH = 1000;
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw new InvalidErrorResponseException(
                InvalidErrorResponseException.ValidationError.INVALID_PARAMETER,
                String.format("Error message exceeds maximum length of %d characters", MAX_MESSAGE_LENGTH)
            );
        }

        if (status < 100 || status > 599) {
            throw new InvalidErrorResponseException(
                InvalidErrorResponseException.ValidationError.INVALID_STATUS_CODE,
                String.valueOf(status)
            );
        }
    }

    /**
     * Safely handle correlation ID with fallback
     */
    private static String safeCorrelationId(String correlationId) {
        return correlationId != null && !correlationId.trim().isEmpty() ?
               correlationId : "missing-correlation-id";
    }

    /**
     * Safely handle path with fallback and sanitization
     */
    private static String safePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return "/unknown";
        }

        // Sanitize path to prevent injection and ensure valid path format
        String sanitized = sanitizePath(path.trim());
        return sanitized.isEmpty() ? "/unknown" : sanitized;
    }

    /**
     * Sanitize path to remove potentially malicious characters while preserving valid path structure
     * Enforces maximum path length to prevent buffer overflow attacks
     */
    private static String sanitizePath(String path) {
        if (path == null) {
            return "";
        }

        // Enforce maximum path length (RFC 3986 suggests 2048 characters for URLs)
        final int MAX_PATH_LENGTH = 2048;
        if (path.length() > MAX_PATH_LENGTH) {
            path = path.substring(0, MAX_PATH_LENGTH);
        }

        // Remove or escape potentially dangerous characters while keeping valid path characters
        // Allow: alphanumeric, forward slash, hyphen, underscore, dot, query parameters
        String sanitized = path.replaceAll("[^a-zA-Z0-9/\\-_.?&=]", "")
                              .replaceAll("/+", "/") // Remove multiple consecutive slashes
                              .replaceAll("\\.\\.+", "."); // Remove directory traversal attempts

        // Final length check after sanitization
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 200);
        }

        // Ensure path starts with forward slash if it's not empty
        if (!sanitized.isEmpty() && !sanitized.startsWith("/")) {
            sanitized = "/" + sanitized;
        }

        return sanitized;
    }

    /**
     * Create a basic error response with validation
     */
    public static ErrorResponse of(String error, String message, int status) {
        validateErrorParams(error, message, status);
        return ErrorResponse.builder()
                .error(error)
                .message(message)
                .status(status)
                .timestamp(now())
                .build();
    }

    /**
     * Create an error response with path and correlation ID with validation
     */
    public static ErrorResponse of(String error, String message, int status, String path, String correlationId) {
        validateErrorParams(error, message, status);
        return ErrorResponse.builder()
                .error(error)
                .message(message)
                .status(status)
                .path(safePath(path))
                .correlationId(safeCorrelationId(correlationId))
                .timestamp(now())
                .build();
    }

    /**
     * Create an unauthorized error response with graceful handling
     */
    public static ErrorResponse unauthorized(String message, String path, String correlationId) {
        String safeMessage = message != null ? message : "Authentication required to access this resource";
        return ErrorResponse.builder()
                .error("unauthorized")
                .message(safeMessage)
                .status(401)
                .path(safePath(path))
                .correlationId(safeCorrelationId(correlationId))
                .timestamp(now())
                .category("authentication")
                .build();
    }

    /**
     * Create an access denied error response with graceful handling
     */
    public static ErrorResponse accessDenied(String message, String path, String correlationId) {
        String safeMessage = message != null ? message : "You do not have permission to access this resource";
        return ErrorResponse.builder()
                .error("access_denied")
                .message(safeMessage)
                .status(403)
                .path(safePath(path))
                .correlationId(safeCorrelationId(correlationId))
                .timestamp(now())
                .category("authorization")
                .build();
    }

    /**
     * Create a service unavailable error response with graceful handling
     */
    public static ErrorResponse serviceUnavailable(String message, String path, String correlationId, String retryAfter) {
        String safeMessage = message != null ? message : "Service is temporarily unavailable";
        String safeRetryAfter = retryAfter != null ? retryAfter : "PT30S";
        return ErrorResponse.builder()
                .error("service_unavailable")
                .message(safeMessage)
                .status(503)
                .path(safePath(path))
                .correlationId(safeCorrelationId(correlationId))
                .retryAfter(safeRetryAfter)
                .timestamp(now())
                .category("service")
                .supportContact("support@mysillydreams.com")
                .build();
    }
}
