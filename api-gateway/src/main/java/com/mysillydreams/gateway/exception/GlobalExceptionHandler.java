package com.mysillydreams.gateway.exception;

import com.mysillydreams.gateway.dto.ErrorResponse;
import com.mysillydreams.gateway.logging.SanitizingLoggerInterceptor;
import com.mysillydreams.gateway.security.SecurityErrorFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ServerWebExchange;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Global exception handler for consistent error response handling across the gateway
 * Provides centralized exception handling with proper logging and error response formatting
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final SanitizingLoggerInterceptor loggingInterceptor;
    private final SecurityErrorFormatter errorFormatter;

    public GlobalExceptionHandler(SanitizingLoggerInterceptor loggingInterceptor,
                                 SecurityErrorFormatter errorFormatter) {
        this.loggingInterceptor = loggingInterceptor;
        this.errorFormatter = errorFormatter;
    }

    /**
     * Handle InvalidErrorResponseException with enhanced error response formatting
     */
    @ExceptionHandler(InvalidErrorResponseException.class)
    public ResponseEntity<ErrorResponse> handleInvalidErrorResponseException(
            InvalidErrorResponseException ex, ServerWebExchange exchange) {

        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);

        // Enhanced logging with nested exception information
        logValidationErrorWithNesting(ex, correlationId, path);

        // Create standardized error response with enhanced details
        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("invalid_error_response")
                .message(ex.getMessage())
                .status(ex.getHttpStatus())
                .path(path)
                .correlationId(correlationId)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .category(ex.getErrorCategory())
                .details(buildExceptionDetails(ex))
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.valueOf(ex.getHttpStatus()));
    }

    /**
     * Handle generic RuntimeException as fallback
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex, ServerWebExchange exchange) {
        
        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);
        
        // Log the runtime error
        logRuntimeError(ex, correlationId, path);
        
        // Create generic error response without exposing internal details
        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("internal_server_error")
                .message("An unexpected error occurred")
                .status(500)
                .path(path)
                .correlationId(correlationId)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .category("system")
                .supportContact("support@mysillydreams.com")
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handle IllegalArgumentException for parameter validation
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, ServerWebExchange exchange) {

        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);

        // Log at INFO level for user input validation errors (not system errors)
        logUserInputError(ex, correlationId, path);

        // Create validation error response
        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("invalid_parameter")
                .message("Invalid parameter provided")
                .status(400)
                .path(path)
                .correlationId(correlationId)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .category("validation")
                .details(sanitizeErrorDetails(ex.getMessage()))
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle NullPointerException and other unexpected system errors
     */
    @ExceptionHandler({NullPointerException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleSystemException(
            RuntimeException ex, ServerWebExchange exchange) {

        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);

        // Log system errors at ERROR level with full stack trace
        logSystemError(ex, correlationId, path);

        // Create generic system error response without exposing internal details
        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("system_error")
                .message("A system error occurred. Please try again later.")
                .status(500)
                .path(path)
                .correlationId(correlationId)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .category("system")
                .supportContact("support@mysillydreams.com")
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Extract correlation ID from request headers
     */
    private String getCorrelationId(ServerWebExchange exchange) {
        if (exchange == null || exchange.getRequest() == null) {
            return "missing-correlation-id";
        }
        
        String correlationId = exchange.getRequest().getHeaders().getFirst("X-Correlation-ID");
        return correlationId != null && !correlationId.trim().isEmpty() ? 
               correlationId : "missing-correlation-id";
    }

    /**
     * Extract request path safely with better fallback handling
     */
    private String getRequestPath(ServerWebExchange exchange) {
        if (exchange == null || exchange.getRequest() == null) {
            return "/unknown-path";
        }

        try {
            String path = exchange.getRequest().getPath().value();
            return path != null && !path.trim().isEmpty() ? path : "/unknown-path";
        } catch (Exception e) {
            logger.debug("Failed to extract request path: {}", e.getMessage());
            return "/unknown-path";
        }
    }

    /**
     * Log validation errors with enhanced structured context
     */
    private void logValidationError(Exception ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "validation");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            // Include nested exception information if available
            String causeInfo = ex.getCause() != null ?
                String.format(" - Cause: %s", ex.getCause().getMessage()) : "";

            logger.warn("Validation error occurred: {} - {} on path: {}{}",
                       ex.getClass().getSimpleName(), sanitizeErrorDetails(ex.getMessage()), path, causeInfo, ex);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Log user input errors at INFO level (not system errors)
     */
    private void logUserInputError(Exception ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "user_input");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            logger.info("User input error occurred: {} - {} on path: {}",
                       ex.getClass().getSimpleName(), sanitizeErrorDetails(ex.getMessage()), path);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Log system errors with full context and stack trace
     */
    private void logSystemError(RuntimeException ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "system");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            // Include nested exception information for system errors
            String causeInfo = ex.getCause() != null ?
                String.format(" - Root cause: %s", ex.getCause().getMessage()) : "";

            logger.error("System error occurred: {} - {} on path: {}{}",
                        ex.getClass().getSimpleName(), sanitizeErrorDetails(ex.getMessage()), path, causeInfo, ex);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Log runtime errors with enhanced structured context
     */
    private void logRuntimeError(RuntimeException ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "runtime");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            // Include nested exception information if available
            String causeInfo = ex.getCause() != null ?
                String.format(" - Cause: %s", ex.getCause().getMessage()) : "";

            logger.error("Runtime error occurred: {} - {} on path: {}{}",
                        ex.getClass().getSimpleName(), sanitizeErrorDetails(ex.getMessage()), path, causeInfo, ex);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Enhanced validation error logging with nested exception information
     */
    private void logValidationErrorWithNesting(Exception ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "validation");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            // Build comprehensive error message with exception chain
            String errorMessage = buildNestedExceptionMessage(ex, "Validation error occurred");

            // Use sanitizing logger interceptor for early sanitization
            loggingInterceptor.logWarn(logger, errorMessage, ex);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Enhanced system error logging with full exception chain
     */
    private void logSystemErrorWithNesting(RuntimeException ex, String correlationId, String path) {
        try {
            MDC.put("correlationId", correlationId);
            MDC.put("path", path);
            MDC.put("errorType", "system");
            MDC.put("exceptionClass", ex.getClass().getSimpleName());

            // Build comprehensive error message with full exception chain
            String errorMessage = buildNestedExceptionMessage(ex, "System error occurred");

            // Use sanitizing logger interceptor for early sanitization
            loggingInterceptor.logError(logger, errorMessage, ex);
        } finally {
            // Comprehensive MDC cleanup
            MDC.remove("correlationId");
            MDC.remove("path");
            MDC.remove("errorType");
            MDC.remove("exceptionClass");
        }
    }

    /**
     * Build nested exception message with full exception chain
     */
    private String buildNestedExceptionMessage(Throwable ex, String prefix) {
        StringBuilder message = new StringBuilder();
        message.append(prefix).append(": ");
        message.append(ex.getClass().getSimpleName()).append(" - ");
        message.append(ex.getMessage() != null ? ex.getMessage() : "No message");

        // Add exception chain information
        List<String> exceptionChain = buildExceptionChain(ex);
        if (exceptionChain.size() > 1) {
            message.append(" | Exception chain: ");
            message.append(String.join(" -> ", exceptionChain));
        }

        return message.toString();
    }

    /**
     * Build exception chain for better debugging
     */
    private List<String> buildExceptionChain(Throwable ex) {
        List<String> chain = new ArrayList<>();
        Throwable current = ex;
        int depth = 0;
        final int MAX_DEPTH = 5; // Prevent infinite loops

        while (current != null && depth < MAX_DEPTH) {
            String exceptionInfo = current.getClass().getSimpleName();
            if (current.getMessage() != null && !current.getMessage().trim().isEmpty()) {
                exceptionInfo += "(" + current.getMessage().substring(0, Math.min(current.getMessage().length(), 100)) + ")";
            }
            chain.add(exceptionInfo);
            current = current.getCause();
            depth++;
        }

        return chain;
    }

    /**
     * Build enhanced exception details with granular information
     */
    private String buildExceptionDetails(Exception ex) {
        StringBuilder details = new StringBuilder();

        // Add exception categorization
        String category = categorizeException(ex);
        details.append(category).append(" error: ").append(ex.getClass().getSimpleName());

        if (ex instanceof InvalidErrorResponseException) {
            InvalidErrorResponseException validationEx = (InvalidErrorResponseException) ex;
            details.append(" - ").append(validationEx.getValidationError().getDescription());

            // Add granular parameter information
            if (validationEx.getParameter() != null) {
                String parameterInfo = buildParameterInfo(validationEx);
                details.append(" (").append(parameterInfo).append(")");
            }
        } else if (ex instanceof IllegalArgumentException) {
            // Add specific parameter validation details
            details.append(" - Parameter validation failed");
            String parameterName = extractParameterName(ex.getMessage());
            if (parameterName != null) {
                details.append(" for parameter: ").append(parameterName);
            }
        }

        // Add root cause with enhanced information
        Throwable rootCause = getRootCause(ex);
        if (rootCause != ex && rootCause.getMessage() != null) {
            details.append(" | Root cause: ").append(rootCause.getClass().getSimpleName());
            String rootCauseCategory = categorizeException(rootCause);
            if (!category.equals(rootCauseCategory)) {
                details.append(" (").append(rootCauseCategory).append(")");
            }
        }

        return details.toString();
    }

    /**
     * Categorize exception for better error tracking
     */
    private String categorizeException(Throwable ex) {
        String exceptionName = ex.getClass().getSimpleName().toLowerCase();

        if (exceptionName.contains("validation") || ex instanceof InvalidErrorResponseException) {
            return "Validation";
        } else if (exceptionName.contains("argument") || exceptionName.contains("parameter")) {
            return "Parameter";
        } else if (exceptionName.contains("authentication") || exceptionName.contains("security")) {
            return "Security";
        } else if (exceptionName.contains("sql") || exceptionName.contains("database") || exceptionName.contains("connection")) {
            return "Database";
        } else if (exceptionName.contains("timeout") || exceptionName.contains("circuit")) {
            return "Network";
        } else if (exceptionName.contains("nullpointer") || exceptionName.contains("illegalstate")) {
            return "System";
        }

        return "Runtime";
    }

    /**
     * Build detailed parameter information for validation errors
     */
    private String buildParameterInfo(InvalidErrorResponseException ex) {
        StringBuilder paramInfo = new StringBuilder();
        paramInfo.append("Parameter: ").append(ex.getParameter());

        // Add validation error type
        paramInfo.append(", Type: ").append(ex.getValidationError().name());

        // Add expected format if available
        String expectedFormat = getExpectedFormat(ex.getValidationError());
        if (expectedFormat != null) {
            paramInfo.append(", Expected: ").append(expectedFormat);
        }

        return paramInfo.toString();
    }

    /**
     * Get expected format for validation errors
     */
    private String getExpectedFormat(InvalidErrorResponseException.ValidationError validationError) {
        switch (validationError) {
            case NULL_ERROR_CODE:
                return "non-empty string";
            case NULL_MESSAGE:
                return "non-empty message";
            case INVALID_STATUS_CODE:
                return "HTTP status code (100-599)";
            case INVALID_PARAMETER:
                return "valid parameter value";
            default:
                return null;
        }
    }

    /**
     * Extract parameter name from exception message
     */
    private String extractParameterName(String message) {
        if (message == null) {
            return null;
        }

        // Common patterns for parameter names in error messages
        if (message.contains("parameter")) {
            String[] parts = message.split("parameter");
            if (parts.length > 1) {
                String paramPart = parts[1].trim();
                // Extract first word after "parameter"
                String[] words = paramPart.split("\\s+");
                if (words.length > 0) {
                    return words[0].replaceAll("[^a-zA-Z0-9_]", "");
                }
            }
        }

        return null;
    }

    /**
     * Get root cause of exception chain
     */
    private Throwable getRootCause(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
    }

    /**
     * Sanitize error details using SecurityErrorFormatter
     */
    private String sanitizeErrorDetails(String details) {
        return errorFormatter.sanitizeErrorDetails(details);
    }
}
