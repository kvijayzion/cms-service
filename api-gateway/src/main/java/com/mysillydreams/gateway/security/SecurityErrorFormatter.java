package com.mysillydreams.gateway.security;

import org.springframework.stereotype.Component;

/**
 * Centralized utility for formatting security error messages and logging
 * Ensures consistency across authentication and authorization handlers
 */
@Component
public class SecurityErrorFormatter {

    // Consistent error messages
    public static final String DEFAULT_AUTH_ERROR_MESSAGE = "Authentication required to access this resource";
    public static final String DEFAULT_ACCESS_DENIED_MESSAGE = "You do not have permission to access this resource";
    public static final String DEFAULT_TOKEN_EXPIRED_MESSAGE = "Your session has expired. Please log in again";
    public static final String DEFAULT_INVALID_CREDENTIALS_MESSAGE = "Invalid credentials provided";
    public static final String DEFAULT_INSUFFICIENT_PRIVILEGES_MESSAGE = "Insufficient privileges to perform this action";

    /**
     * Format authentication failure message with context
     */
    public String formatAuthenticationFailure(String path, String reason) {
        if (reason != null && !reason.trim().isEmpty()) {
            return String.format("Authentication failed for path: %s - %s", path, reason);
        }
        return String.format("Authentication failed for path: %s", path);
    }

    /**
     * Format access denied message with user context
     */
    public String formatAccessDenied(String path, String userId, String username, String roles, String reason) {
        StringBuilder message = new StringBuilder();
        message.append("Access denied on path: ").append(path);
        
        if (userId != null || username != null || roles != null) {
            message.append(" - User: ")
                   .append(username != null ? username : "unknown")
                   .append(" (ID: ")
                   .append(userId != null ? userId : "unknown")
                   .append(", Roles: ")
                   .append(roles != null ? roles : "unknown")
                   .append(")");
        }
        
        if (reason != null && !reason.trim().isEmpty()) {
            message.append(" - ").append(reason);
        }
        
        return message.toString();
    }

    /**
     * Format generic security error message
     */
    public String formatSecurityError(String errorType, String path, String details) {
        StringBuilder message = new StringBuilder();
        message.append(errorType).append(" on path: ").append(path);
        
        if (details != null && !details.trim().isEmpty()) {
            message.append(" - ").append(details);
        }
        
        return message.toString();
    }

    /**
     * Enhanced error message selection with user context and path information
     */
    public String getErrorMessageForException(Throwable ex) {
        return getErrorMessageForException(ex, null, null, null);
    }

    /**
     * Enhanced error message selection with additional context
     */
    public String getErrorMessageForException(Throwable ex, String path, String userId, String username) {
        if (ex == null) {
            return DEFAULT_AUTH_ERROR_MESSAGE;
        }

        String exceptionName = ex.getClass().getSimpleName().toLowerCase();
        String exceptionMessage = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        // Check for specific authentication scenarios with context
        if (isTokenExpired(exceptionName, exceptionMessage)) {
            return buildContextualMessage(DEFAULT_TOKEN_EXPIRED_MESSAGE, path, "Please log in again to continue.");
        } else if (isInvalidCredentials(exceptionName, exceptionMessage)) {
            return buildContextualMessage(DEFAULT_INVALID_CREDENTIALS_MESSAGE, path, "Please check your username and password.");
        } else if (isInsufficientPrivileges(exceptionName, exceptionMessage)) {
            return buildContextualMessage(DEFAULT_INSUFFICIENT_PRIVILEGES_MESSAGE, path, "Contact your administrator if you believe this is an error.");
        } else if (isAccountLocked(exceptionName, exceptionMessage)) {
            return buildContextualMessage("Your account has been temporarily locked.", path, "Please contact support for assistance.");
        } else if (isSessionInvalid(exceptionName, exceptionMessage)) {
            return buildContextualMessage("Your session is invalid.", path, "Please log in again to continue.");
        }

        return buildContextualMessage(DEFAULT_AUTH_ERROR_MESSAGE, path, null);
    }

    /**
     * Build contextual error message with path and action guidance
     */
    private String buildContextualMessage(String baseMessage, String path, String actionGuidance) {
        StringBuilder message = new StringBuilder(baseMessage);

        if (path != null && !path.trim().isEmpty() && !"/unknown-path".equals(path)) {
            // Only add path context for meaningful paths
            if (path.contains("/api/")) {
                String resourceType = extractResourceType(path);
                if (resourceType != null) {
                    message.append(" Access to ").append(resourceType).append(" requires authentication.");
                }
            }
        }

        if (actionGuidance != null && !actionGuidance.trim().isEmpty()) {
            message.append(" ").append(actionGuidance);
        }

        return message.toString();
    }

    /**
     * Extract resource type from API path for better user guidance
     */
    private String extractResourceType(String path) {
        if (path.contains("/users")) return "user resources";
        if (path.contains("/admin")) return "administrative resources";
        if (path.contains("/auth")) return "authentication services";
        if (path.contains("/profile")) return "profile information";
        if (path.contains("/settings")) return "account settings";
        return null;
    }

    /**
     * Determine if error is due to token expiration
     */
    private boolean isTokenExpired(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("expired") ||
               exceptionMessage.contains("expired") ||
               exceptionMessage.contains("token has expired") ||
               exceptionMessage.contains("session expired");
    }

    /**
     * Determine if error is due to invalid credentials
     */
    private boolean isInvalidCredentials(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("credentials") ||
               exceptionName.contains("authentication") ||
               exceptionMessage.contains("bad credentials") ||
               exceptionMessage.contains("invalid username") ||
               exceptionMessage.contains("invalid password");
    }

    /**
     * Determine if error is due to insufficient privileges
     */
    private boolean isInsufficientPrivileges(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("access") ||
               exceptionName.contains("authorization") ||
               exceptionMessage.contains("access denied") ||
               exceptionMessage.contains("insufficient privileges") ||
               exceptionMessage.contains("permission denied");
    }

    /**
     * Determine if error is due to account being locked
     */
    private boolean isAccountLocked(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("locked") ||
               exceptionMessage.contains("account locked") ||
               exceptionMessage.contains("user locked") ||
               exceptionMessage.contains("temporarily disabled");
    }

    /**
     * Determine if error is due to invalid session
     */
    private boolean isSessionInvalid(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("session") ||
               exceptionMessage.contains("invalid session") ||
               exceptionMessage.contains("session not found") ||
               exceptionMessage.contains("malformed token");
    }

    /**
     * Enhanced sanitization for error details with comprehensive pattern matching
     */
    public String sanitizeErrorDetails(String details) {
        if (details == null) {
            return "";
        }

        // Remove potential sensitive information from error details
        String sanitized = details
                // Enhanced credential patterns (including variations)
                .replaceAll("(?i)(password|passwd|pwd|token|secret|key|credential|apikey|api_key|access_key|private_key|refresh_token|id_token)\\s*[=:]\\s*[^\\s,;\"'\\]\\}]+", "$1=[REDACTED]")
                // Authorization headers and bearer tokens (multiple formats)
                .replaceAll("(?i)(authorization|bearer|basic|digest)\\s*[=:]?\\s*[^\\s,;\"'\\]\\}]+", "$1 [REDACTED]")
                // JWT tokens in various locations (headers, cookies, query params)
                .replaceAll("(?i)(jwt|access_token|refresh_token|id_token)\\s*[=:]\\s*[A-Za-z0-9+/._-]{20,}={0,2}", "$1=[JWT_REDACTED]")
                .replaceAll("(?i)cookie:\\s*[^;]*(?:jwt|token|session)[^;]*=[^;\\s]+", "Cookie: [COOKIE_REDACTED]")
                .replaceAll("(?i)[?&](jwt|token|access_token|refresh_token)=[A-Za-z0-9+/._-]{20,}={0,2}", "?$1=[QUERY_TOKEN_REDACTED]")
                // Remove email addresses
                .replaceAll("(?i)\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "[EMAIL_REDACTED]")
                // Enhanced JWT token patterns (standard JWT format)
                .replaceAll("(?i)\\beyJ[A-Za-z0-9+/._-]*\\.[A-Za-z0-9+/._-]*\\.[A-Za-z0-9+/._-]*\\b", "[JWT_REDACTED]")
                // Remove potential base64 tokens (enhanced patterns)
                .replaceAll("(?i)\\b[A-Za-z0-9+/]{20,}={0,2}\\b", "[TOKEN_REDACTED]")
                // Remove IP addresses (IPv4 and IPv6)
                .replaceAll("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b", "[IP_REDACTED]")
                .replaceAll("(?i)\\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\\b", "[IPV6_REDACTED]")
                // Remove potential session IDs and UUIDs
                .replaceAll("\\b[A-Za-z0-9]{32,}\\b", "[SESSION_REDACTED]")
                .replaceAll("\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b", "[UUID_REDACTED]")
                // Remove phone numbers
                .replaceAll("\\b(?:\\+?1[-.]?)?\\(?[0-9]{3}\\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\\b", "[PHONE_REDACTED]")
                // Remove credit card numbers (basic pattern)
                .replaceAll("\\b(?:[0-9]{4}[-\\s]?){3}[0-9]{4}\\b", "[CARD_REDACTED]")
                // Remove social security numbers (US format)
                .replaceAll("\\b[0-9]{3}-[0-9]{2}-[0-9]{4}\\b", "[SSN_REDACTED]")
                // Remove potential database connection strings
                .replaceAll("(?i)(jdbc|mongodb|mysql|postgresql)://[^\\s,;\"']+", "$1://[CONNECTION_REDACTED]");

        // Limit length to prevent log flooding
        return sanitized.substring(0, Math.min(sanitized.length(), 500));
    }

    /**
     * Validate and sanitize user input for error messages
     */
    public String validateAndSanitizeMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "No error message provided";
        }

        // Limit message length
        final int MAX_MESSAGE_LENGTH = 1000;
        if (message.length() > MAX_MESSAGE_LENGTH) {
            message = message.substring(0, MAX_MESSAGE_LENGTH) + "... [truncated]";
        }

        // Sanitize the message
        return sanitizeErrorDetails(message);
    }

    /**
     * Create user context string for logging
     */
    public String createUserContext(String userId, String username, String roles) {
        return String.format("User: %s (ID: %s, Roles: %s)",
                           username != null ? username : "unknown",
                           userId != null ? userId : "unknown",
                           roles != null ? roles : "unknown");
    }

    /**
     * Enhanced error level determination with more granular categorization
     */
    public LogLevel getAppropriateLogLevel(Throwable ex) {
        if (ex == null) {
            return LogLevel.INFO;
        }

        String exceptionName = ex.getClass().getSimpleName().toLowerCase();
        String exceptionMessage = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        // System errors and unexpected exceptions
        if (isSystemError(exceptionName, exceptionMessage)) {
            return LogLevel.ERROR;
        }

        // Security-related but expected errors
        if (isSecurityError(exceptionName, exceptionMessage)) {
            return LogLevel.WARN;
        }

        // User input validation errors
        if (isUserInputError(exceptionName, exceptionMessage)) {
            return LogLevel.INFO;
        }

        // Default to WARN for unknown authentication/authorization issues
        return LogLevel.WARN;
    }

    /**
     * Determine if error should be logged at ERROR level (legacy method for backward compatibility)
     */
    public boolean isErrorLevelException(Throwable ex) {
        return getAppropriateLogLevel(ex) == LogLevel.ERROR;
    }

    /**
     * Check if this is a system error requiring ERROR level logging
     */
    private boolean isSystemError(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("nullpointer") ||
               exceptionName.contains("illegalstate") ||
               exceptionName.contains("runtime") ||
               exceptionName.contains("sql") ||
               exceptionName.contains("connection") ||
               exceptionMessage.contains("database") ||
               exceptionMessage.contains("connection refused") ||
               exceptionMessage.contains("timeout");
    }

    /**
     * Check if this is a security error requiring WARN level logging
     */
    private boolean isSecurityError(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("authentication") ||
               exceptionName.contains("access") ||
               exceptionName.contains("authorization") ||
               exceptionName.contains("expired") ||
               exceptionName.contains("credentials") ||
               exceptionName.contains("token");
    }

    /**
     * Check if this is a user input error requiring INFO level logging
     */
    private boolean isUserInputError(String exceptionName, String exceptionMessage) {
        return exceptionName.contains("illegalargument") ||
               exceptionName.contains("validation") ||
               exceptionMessage.contains("invalid parameter") ||
               exceptionMessage.contains("bad request");
    }

    /**
     * Log level enumeration for better type safety
     */
    public enum LogLevel {
        ERROR, WARN, INFO, DEBUG
    }
}
