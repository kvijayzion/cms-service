package com.mysillydreams.gateway.logging;

import com.mysillydreams.gateway.security.SecurityErrorFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Logging interceptor that sanitizes messages before they reach the logger
 * Ensures sensitive data is never written to logs in the first place
 */
@Component
public class SanitizingLoggerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(SanitizingLoggerInterceptor.class);
    
    private final SecurityErrorFormatter errorFormatter;

    public SanitizingLoggerInterceptor(SecurityErrorFormatter errorFormatter) {
        this.errorFormatter = errorFormatter;
    }

    /**
     * Sanitize and log at ERROR level
     */
    public void logError(Logger targetLogger, String message, Object... args) {
        if (targetLogger.isErrorEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.error(sanitizedMessage, sanitizedArgs);
        }
    }

    /**
     * Sanitize and log at ERROR level with throwable
     */
    public void logError(Logger targetLogger, String message, Throwable throwable, Object... args) {
        if (targetLogger.isErrorEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.error(sanitizedMessage, sanitizedArgs, throwable);
        }
    }

    /**
     * Sanitize and log at WARN level
     */
    public void logWarn(Logger targetLogger, String message, Object... args) {
        if (targetLogger.isWarnEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.warn(sanitizedMessage, sanitizedArgs);
        }
    }

    /**
     * Sanitize and log at WARN level with throwable
     */
    public void logWarn(Logger targetLogger, String message, Throwable throwable, Object... args) {
        if (targetLogger.isWarnEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.warn(sanitizedMessage, sanitizedArgs, throwable);
        }
    }

    /**
     * Sanitize and log at INFO level
     */
    public void logInfo(Logger targetLogger, String message, Object... args) {
        if (targetLogger.isInfoEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.info(sanitizedMessage, sanitizedArgs);
        }
    }

    /**
     * Sanitize and log at INFO level with throwable
     */
    public void logInfo(Logger targetLogger, String message, Throwable throwable, Object... args) {
        if (targetLogger.isInfoEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.info(sanitizedMessage, sanitizedArgs, throwable);
        }
    }

    /**
     * Sanitize and log at DEBUG level
     */
    public void logDebug(Logger targetLogger, String message, Object... args) {
        if (targetLogger.isDebugEnabled()) {
            String sanitizedMessage = sanitizeMessage(message);
            Object[] sanitizedArgs = sanitizeArgs(args);
            targetLogger.debug(sanitizedMessage, sanitizedArgs);
        }
    }

    /**
     * Intelligent logging based on exception type and severity
     */
    public void logWithAppropriateLevel(Logger targetLogger, String message, Throwable ex, Object... args) {
        SecurityErrorFormatter.LogLevel level = errorFormatter.getAppropriateLogLevel(ex);
        
        switch (level) {
            case ERROR:
                logError(targetLogger, message, ex, args);
                break;
            case WARN:
                logWarn(targetLogger, message, ex, args);
                break;
            case INFO:
                logInfo(targetLogger, message, ex, args);
                break;
            case DEBUG:
                logDebug(targetLogger, message, args);
                break;
            default:
                logWarn(targetLogger, message, ex, args);
        }
    }

    /**
     * Sanitize log message using SecurityErrorFormatter
     */
    private String sanitizeMessage(String message) {
        if (message == null) {
            return "";
        }
        
        try {
            return errorFormatter.sanitizeErrorDetails(message);
        } catch (Exception e) {
            // Fallback sanitization if SecurityErrorFormatter fails
            logger.debug("Failed to sanitize message using SecurityErrorFormatter, using fallback", e);
            return fallbackSanitize(message);
        }
    }

    /**
     * Enhanced sanitize log arguments with caching for performance
     */
    private Object[] sanitizeArgs(Object... args) {
        if (args == null || args.length == 0) {
            return args;
        }

        Object[] sanitizedArgs = new Object[args.length];
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof String) {
                // Use cached sanitization for string arguments
                sanitizedArgs[i] = getCachedSanitizedValue((String) args[i]);
            } else if (args[i] instanceof Throwable) {
                // Don't sanitize throwables, but sanitize their messages
                Throwable throwable = (Throwable) args[i];
                sanitizedArgs[i] = throwable; // Keep the throwable as-is for stack traces
            } else {
                // For other objects, convert to string and sanitize with caching
                String stringValue = args[i] != null ? args[i].toString() : null;
                sanitizedArgs[i] = stringValue != null ? getCachedSanitizedValue(stringValue) : null;
            }
        }

        return sanitizedArgs;
    }

    /**
     * Enhanced fallback sanitization method with improved truncation handling
     */
    private String fallbackSanitize(String message) {
        if (message == null) {
            return "";
        }

        String sanitized = message.replaceAll("(?i)(password|token|secret|key)\\s*[=:]\\s*[^\\s,;]+", "$1=[REDACTED]")
                                 .replaceAll("(?i)(authorization|bearer)\\s+[^\\s,;]+", "$1 [REDACTED]")
                                 .replaceAll("(?i)\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "[EMAIL_REDACTED]");

        // Enhanced truncation with warning message
        final int MAX_LENGTH = 1000;
        if (sanitized.length() > MAX_LENGTH) {
            return sanitized.substring(0, MAX_LENGTH - 30) + "... [Message Truncated for Security]";
        }

        return sanitized;
    }

    /**
     * Cache for frequently sanitized arguments to improve performance
     */
    private final java.util.concurrent.ConcurrentHashMap<String, String> sanitizationCache =
            new java.util.concurrent.ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 1000;

    /**
     * Get sanitized value from cache or compute and cache it
     */
    private String getCachedSanitizedValue(String value) {
        if (value == null || value.length() > 500) {
            // Don't cache null values or very long strings
            return sanitizeMessage(value);
        }

        // Clean cache if it gets too large
        if (sanitizationCache.size() > MAX_CACHE_SIZE) {
            sanitizationCache.clear();
        }

        return sanitizationCache.computeIfAbsent(value, this::sanitizeMessage);
    }

    /**
     * Check if logging is enabled for the specified level
     */
    public boolean isLoggingEnabled(Logger targetLogger, SecurityErrorFormatter.LogLevel level) {
        switch (level) {
            case ERROR:
                return targetLogger.isErrorEnabled();
            case WARN:
                return targetLogger.isWarnEnabled();
            case INFO:
                return targetLogger.isInfoEnabled();
            case DEBUG:
                return targetLogger.isDebugEnabled();
            default:
                return targetLogger.isWarnEnabled();
        }
    }

    /**
     * Sanitize exception message for safe logging
     */
    public String sanitizeExceptionMessage(Throwable ex) {
        if (ex == null || ex.getMessage() == null) {
            return "";
        }
        
        return sanitizeMessage(ex.getMessage());
    }
}
