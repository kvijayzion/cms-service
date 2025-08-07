package com.mysillydreams.gateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Custom authentication entry point that returns JSON responses
 * instead of default HTML for authentication failures.
 * Uses AbstractErrorHandler for consistent error response formatting.
 */
@Component
public class CustomAuthenticationEntryPoint extends AbstractErrorHandler implements ServerAuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(CustomAuthenticationEntryPoint.class);

    private final SecurityErrorFormatter errorFormatter;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper,
                                         @Value("${security.realm:api}") String realm,
                                         SecurityErrorFormatter errorFormatter) {
        super(objectMapper, realm);
        this.errorFormatter = errorFormatter;
    }

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        String correlationId = getCorrelationId(exchange);
        String path = getRequestPath(exchange);

        // Create standardized error response with enhanced context-aware messaging
        String userId = getUserId(exchange);
        String username = getUsername(exchange);
        String errorMessage = errorFormatter.getErrorMessageForException(ex, path, userId, username);
        ErrorResponse errorResponse = ErrorResponse.unauthorized(
            errorMessage,
            path,
            correlationId
        );

        // Enhanced logging with intelligent level selection
        String sanitizedDetails = errorFormatter.validateAndSanitizeMessage(ex.getMessage());
        String logMessage = errorFormatter.formatAuthenticationFailure(path, sanitizedDetails);

        // Use intelligent logging based on exception type
        SecurityErrorFormatter.LogLevel logLevel = errorFormatter.getAppropriateLogLevel(ex);
        if (logLevel == SecurityErrorFormatter.LogLevel.ERROR) {
            // System errors get full stack trace
            logError(logMessage, 401, correlationId, ex);
        } else {
            // Expected authentication failures don't need stack trace
            logError(logMessage, 401, correlationId, null);
        }

        // Use abstract handler to write error response
        return writeError(exchange, errorResponse);
    }
}
