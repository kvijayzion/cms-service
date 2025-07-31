package com.mysillydreams.gateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Custom access denied handler that returns JSON responses
 * instead of default HTML for access denied errors.
 * Uses AbstractErrorHandler for consistent error response formatting.
 */
@Component
public class CustomAccessDeniedHandler extends AbstractErrorHandler implements ServerAccessDeniedHandler {

    private static final Logger logger = LoggerFactory.getLogger(CustomAccessDeniedHandler.class);

    private final SecurityErrorFormatter errorFormatter;

    public CustomAccessDeniedHandler(ObjectMapper objectMapper,
                                    @Value("${security.realm:api}") String realm,
                                    SecurityErrorFormatter errorFormatter) {
        super(objectMapper, realm);
        this.errorFormatter = errorFormatter;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException denied) {
        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);
        String userId = getUserId(exchange);
        String username = getUsername(exchange);
        String userRoles = getUserRoles(exchange);

        // Create standardized error response with enhanced context-aware messaging
        String errorMessage = errorFormatter.getErrorMessageForException(denied, path, userId, username);
        ErrorResponse errorResponse = ErrorResponse.accessDenied(
            errorMessage,
            path,
            correlationId
        );

        // Enhanced logging with intelligent level selection and user context
        String sanitizedDetails = errorFormatter.validateAndSanitizeMessage(denied.getMessage());
        String logMessage = errorFormatter.formatAccessDenied(path, userId, username, userRoles, sanitizedDetails);

        // Use intelligent logging based on exception type
        SecurityErrorFormatter.LogLevel logLevel = errorFormatter.getAppropriateLogLevel(denied);
        if (logLevel == SecurityErrorFormatter.LogLevel.ERROR) {
            // System errors get full stack trace
            logErrorWithUserContextAndRoles(logMessage, 403, correlationId, userId, username, userRoles, denied);
        } else {
            // Expected authorization failures don't need stack trace
            logErrorWithUserContextAndRoles(logMessage, 403, correlationId, userId, username, userRoles, null);
        }

        // Use abstract handler to write error response
        return writeError(exchange, errorResponse);
    }
}
