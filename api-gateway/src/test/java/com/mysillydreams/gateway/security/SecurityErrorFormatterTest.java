package com.mysillydreams.gateway.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for SecurityErrorFormatter focusing on message formatting and sanitization
 */
class SecurityErrorFormatterTest {

    private SecurityErrorFormatter errorFormatter;

    @BeforeEach
    void setUp() {
        errorFormatter = new SecurityErrorFormatter();
    }

    @Test
    void shouldFormatAuthenticationFailureWithReason() {
        // When
        String formatted = errorFormatter.formatAuthenticationFailure("/api/users", "Invalid credentials");

        // Then
        assertEquals("Authentication failed for path: /api/users - Invalid credentials", formatted);
    }

    @Test
    void shouldFormatAuthenticationFailureWithoutReason() {
        // When
        String formatted = errorFormatter.formatAuthenticationFailure("/api/users", null);

        // Then
        assertEquals("Authentication failed for path: /api/users", formatted);
    }

    @Test
    void shouldFormatAccessDeniedWithFullUserContext() {
        // When
        String formatted = errorFormatter.formatAccessDenied("/api/admin", "user123", "john.doe", "USER,ADMIN", "Insufficient privileges");

        // Then
        assertTrue(formatted.contains("Access denied on path: /api/admin"));
        assertTrue(formatted.contains("User: john.doe"));
        assertTrue(formatted.contains("ID: user123"));
        assertTrue(formatted.contains("Roles: USER,ADMIN"));
        assertTrue(formatted.contains("Insufficient privileges"));
    }

    @Test
    void shouldFormatAccessDeniedWithPartialUserContext() {
        // When
        String formatted = errorFormatter.formatAccessDenied("/api/admin", null, "john.doe", null, null);

        // Then
        assertTrue(formatted.contains("Access denied on path: /api/admin"));
        assertTrue(formatted.contains("User: john.doe"));
        assertTrue(formatted.contains("ID: unknown"));
        assertTrue(formatted.contains("Roles: unknown"));
    }

    @Test
    void shouldGetErrorMessageForExpiredException() {
        // Given
        Exception expiredException = new RuntimeException("Token expired");

        // When
        String message = errorFormatter.getErrorMessageForException(expiredException);

        // Then
        assertEquals(SecurityErrorFormatter.DEFAULT_TOKEN_EXPIRED_MESSAGE, message);
    }

    @Test
    void shouldGetErrorMessageForCredentialsException() {
        // Given
        AuthenticationException credentialsException = new BadCredentialsException("Bad credentials");

        // When
        String message = errorFormatter.getErrorMessageForException(credentialsException);

        // Then
        assertEquals(SecurityErrorFormatter.DEFAULT_INVALID_CREDENTIALS_MESSAGE, message);
    }

    @Test
    void shouldGetErrorMessageForAccessException() {
        // Given
        AccessDeniedException accessException = new AccessDeniedException("Access denied");

        // When
        String message = errorFormatter.getErrorMessageForException(accessException);

        // Then
        assertEquals(SecurityErrorFormatter.DEFAULT_INSUFFICIENT_PRIVILEGES_MESSAGE, message);
    }

    @Test
    void shouldGetDefaultErrorMessageForUnknownException() {
        // Given
        Exception unknownException = new RuntimeException("Unknown error");

        // When
        String message = errorFormatter.getErrorMessageForException(unknownException);

        // Then
        assertEquals(SecurityErrorFormatter.DEFAULT_AUTH_ERROR_MESSAGE, message);
    }

    @Test
    void shouldSanitizePasswordInErrorDetails() {
        // Given
        String details = "Authentication failed with password=secret123 and token=abc123";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("password=[REDACTED]"));
        assertTrue(sanitized.contains("token=[REDACTED]"));
        assertFalse(sanitized.contains("secret123"));
        assertFalse(sanitized.contains("abc123"));
    }

    @Test
    void shouldSanitizeAuthorizationHeaderInErrorDetails() {
        // Given
        String details = "Request failed with Authorization Bearer eyJhbGciOiJIUzI1NiJ9";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("Authorization [REDACTED]"));
        assertFalse(sanitized.contains("eyJhbGciOiJIUzI1NiJ9"));
    }

    @Test
    void shouldSanitizeEmailAddresses() {
        // Given
        String details = "User john.doe@example.com failed authentication";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("[EMAIL_REDACTED]"));
        assertFalse(sanitized.contains("john.doe@example.com"));
    }

    @Test
    void shouldSanitizeJwtTokens() {
        // Given
        String details = "Invalid JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("[TOKEN_REDACTED]"));
        assertFalse(sanitized.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
    }

    @Test
    void shouldSanitizeIpAddresses() {
        // Given
        String details = "Request from IP address 192.168.1.100 was blocked";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("[IP_REDACTED]"));
        assertFalse(sanitized.contains("192.168.1.100"));
    }

    @Test
    void shouldSanitizeSessionIds() {
        // Given
        String details = "Session ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567 expired";

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(details);

        // Then
        assertTrue(sanitized.contains("[SESSION_REDACTED]"));
        assertFalse(sanitized.contains("ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567"));
    }

    @Test
    void shouldValidateAndSanitizeMessage() {
        // Given
        String longMessage = "Error occurred with password=secret123 " + "a".repeat(1100);

        // When
        String result = errorFormatter.validateAndSanitizeMessage(longMessage);

        // Then
        assertTrue(result.length() <= 1000 + "... [truncated]".length());
        assertTrue(result.contains("password=[REDACTED]"));
        assertTrue(result.contains("... [truncated]"));
    }

    @Test
    void shouldHandleNullMessageValidation() {
        // When
        String result = errorFormatter.validateAndSanitizeMessage(null);

        // Then
        assertEquals("No error message provided", result);
    }

    @Test
    void shouldHandleEmptyMessageValidation() {
        // When
        String result = errorFormatter.validateAndSanitizeMessage("   ");

        // Then
        assertEquals("No error message provided", result);
    }

    @Test
    void shouldProvideContextualErrorMessages() {
        // Given
        Exception tokenExpired = new RuntimeException("Token expired");
        String path = "/api/users/profile";
        String userId = "user123";
        String username = "john.doe";

        // When
        String message = errorFormatter.getErrorMessageForException(tokenExpired, path, userId, username);

        // Then
        assertTrue(message.contains("Your session has expired"));
        assertTrue(message.contains("user resources"));
        assertTrue(message.contains("Please log in again"));
    }

    @Test
    void shouldExtractResourceTypeFromPath() {
        // Given
        Exception authError = new RuntimeException("Authentication failed");

        // When
        String adminMessage = errorFormatter.getErrorMessageForException(authError, "/api/admin/users", null, null);
        String userMessage = errorFormatter.getErrorMessageForException(authError, "/api/users/profile", null, null);
        String authMessage = errorFormatter.getErrorMessageForException(authError, "/api/auth/login", null, null);

        // Then
        assertTrue(adminMessage.contains("administrative resources"));
        assertTrue(userMessage.contains("user resources"));
        assertTrue(authMessage.contains("authentication services"));
    }

    @Test
    void shouldSanitizeJwtTokensInVariousFormats() {
        // Given
        String headerToken = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
        String cookieToken = "Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U; session=abc123";
        String queryToken = "GET /api/data?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";

        // When
        String sanitizedHeader = errorFormatter.sanitizeErrorDetails(headerToken);
        String sanitizedCookie = errorFormatter.sanitizeErrorDetails(cookieToken);
        String sanitizedQuery = errorFormatter.sanitizeErrorDetails(queryToken);

        // Then
        assertTrue(sanitizedHeader.contains("[REDACTED]") || sanitizedHeader.contains("[JWT_REDACTED]"));
        assertTrue(sanitizedCookie.contains("[COOKIE_REDACTED]") || sanitizedCookie.contains("[JWT_REDACTED]"));
        assertTrue(sanitizedQuery.contains("[QUERY_TOKEN_REDACTED]") || sanitizedQuery.contains("[JWT_REDACTED]"));

        // Verify actual JWT tokens are removed
        assertFalse(sanitizedHeader.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
        assertFalse(sanitizedCookie.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
        assertFalse(sanitizedQuery.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
    }

    @Test
    void shouldLimitErrorDetailsLength() {
        // Given
        String longDetails = "Error: " + "a".repeat(600);

        // When
        String sanitized = errorFormatter.sanitizeErrorDetails(longDetails);

        // Then
        assertTrue(sanitized.length() <= 500);
    }

    @Test
    void shouldCreateUserContextString() {
        // When
        String userContext = errorFormatter.createUserContext("user123", "john.doe", "USER,ADMIN");

        // Then
        assertEquals("User: john.doe (ID: user123, Roles: USER,ADMIN)", userContext);
    }

    @Test
    void shouldCreateUserContextWithUnknownValues() {
        // When
        String userContext = errorFormatter.createUserContext(null, null, null);

        // Then
        assertEquals("User: unknown (ID: unknown, Roles: unknown)", userContext);
    }

    @Test
    void shouldIdentifyErrorLevelExceptions() {
        // Given
        RuntimeException systemError = new RuntimeException("System failure");
        
        // When/Then
        assertTrue(errorFormatter.isErrorLevelException(systemError));
    }

    @Test
    void shouldIdentifyWarnLevelExceptions() {
        // Given
        AuthenticationException authError = new BadCredentialsException("Bad credentials");
        AccessDeniedException accessError = new AccessDeniedException("Access denied");
        RuntimeException expiredError = new RuntimeException("Token expired");
        
        // When/Then
        assertFalse(errorFormatter.isErrorLevelException(authError));
        assertFalse(errorFormatter.isErrorLevelException(accessError));
        assertFalse(errorFormatter.isErrorLevelException(expiredError));
    }

    @Test
    void shouldHandleNullException() {
        // When/Then
        assertFalse(errorFormatter.isErrorLevelException(null));
        assertEquals(SecurityErrorFormatter.DEFAULT_AUTH_ERROR_MESSAGE, 
                    errorFormatter.getErrorMessageForException(null));
    }

    @Test
    void shouldFormatGenericSecurityError() {
        // When
        String formatted = errorFormatter.formatSecurityError("Rate limit exceeded", "/api/users", "Too many requests");

        // Then
        assertEquals("Rate limit exceeded on path: /api/users - Too many requests", formatted);
    }

    @Test
    void shouldFormatGenericSecurityErrorWithoutDetails() {
        // When
        String formatted = errorFormatter.formatSecurityError("Rate limit exceeded", "/api/users", null);

        // Then
        assertEquals("Rate limit exceeded on path: /api/users", formatted);
    }

    @Test
    void shouldHandleEmptyStringsGracefully() {
        // When/Then
        assertDoesNotThrow(() -> {
            errorFormatter.formatAuthenticationFailure("/test", "");
            errorFormatter.formatAccessDenied("/test", "", "", "", "");
            errorFormatter.sanitizeErrorDetails("");
            errorFormatter.createUserContext("", "", "");
        });
    }
}
