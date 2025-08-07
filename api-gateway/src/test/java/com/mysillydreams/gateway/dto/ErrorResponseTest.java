package com.mysillydreams.gateway.dto;

import com.mysillydreams.gateway.exception.InvalidErrorResponseException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for ErrorResponse with focus on validation and graceful handling
 */
class ErrorResponseTest {

    @Test
    void shouldCreateBasicErrorResponseWithValidation() {
        // When
        ErrorResponse response = ErrorResponse.of("test_error", "Test message", 400);

        // Then
        assertEquals("test_error", response.getError());
        assertEquals("Test message", response.getMessage());
        assertEquals(400, response.getStatus());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void shouldThrowCustomExceptionForNullError() {
        // When/Then
        InvalidErrorResponseException exception = assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of(null, "Test message", 400));

        assertTrue(exception.isErrorCodeInvalid());
        assertEquals(InvalidErrorResponseException.ValidationError.NULL_ERROR_CODE, exception.getValidationError());
    }

    @Test
    void shouldThrowCustomExceptionForEmptyError() {
        // When/Then
        InvalidErrorResponseException exception = assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of("", "Test message", 400));

        assertTrue(exception.isErrorCodeInvalid());
        assertEquals(InvalidErrorResponseException.ValidationError.NULL_ERROR_CODE, exception.getValidationError());
    }

    @Test
    void shouldThrowCustomExceptionForNullMessage() {
        // When/Then
        InvalidErrorResponseException exception = assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of("test_error", null, 400));

        assertTrue(exception.isMessageInvalid());
        assertEquals(InvalidErrorResponseException.ValidationError.NULL_MESSAGE, exception.getValidationError());
    }

    @Test
    void shouldThrowCustomExceptionForInvalidStatusCode() {
        // When/Then
        InvalidErrorResponseException exception = assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of("test_error", "Test message", 99));

        assertTrue(exception.isStatusCodeInvalid());
        assertEquals(InvalidErrorResponseException.ValidationError.INVALID_STATUS_CODE, exception.getValidationError());
        assertEquals("99", exception.getParameter());
    }

    @Test
    void shouldHandleNullCorrelationIdGracefully() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized("Test message", "/test", null);

        // Then
        assertEquals("missing-correlation-id", response.getCorrelationId());
    }

    @Test
    void shouldHandleEmptyCorrelationIdGracefully() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized("Test message", "/test", "");

        // Then
        assertEquals("missing-correlation-id", response.getCorrelationId());
    }

    @Test
    void shouldHandleNullPathGracefully() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized("Test message", null, "corr-123");

        // Then
        assertEquals("/unknown", response.getPath());
    }

    @Test
    void shouldHandleEmptyPathGracefully() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized("Test message", "", "corr-123");

        // Then
        assertEquals("/unknown", response.getPath());
    }

    @Test
    void shouldCreateUnauthorizedResponseWithDefaults() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized(null, null, null);

        // Then
        assertEquals("unauthorized", response.getError());
        assertEquals("Authentication required to access this resource", response.getMessage());
        assertEquals(401, response.getStatus());
        assertEquals("/unknown", response.getPath());
        assertEquals("missing-correlation-id", response.getCorrelationId());
        assertEquals("authentication", response.getCategory());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void shouldCreateAccessDeniedResponseWithDefaults() {
        // When
        ErrorResponse response = ErrorResponse.accessDenied(null, null, null);

        // Then
        assertEquals("access_denied", response.getError());
        assertEquals("You do not have permission to access this resource", response.getMessage());
        assertEquals(403, response.getStatus());
        assertEquals("/unknown", response.getPath());
        assertEquals("missing-correlation-id", response.getCorrelationId());
        assertEquals("authorization", response.getCategory());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void shouldCreateServiceUnavailableResponseWithDefaults() {
        // When
        ErrorResponse response = ErrorResponse.serviceUnavailable(null, null, null, null);

        // Then
        assertEquals("service_unavailable", response.getError());
        assertEquals("Service is temporarily unavailable", response.getMessage());
        assertEquals(503, response.getStatus());
        assertEquals("/unknown", response.getPath());
        assertEquals("missing-correlation-id", response.getCorrelationId());
        assertEquals("PT30S", response.getRetryAfter());
        assertEquals("service", response.getCategory());
        assertEquals("support@mysillydreams.com", response.getSupportContact());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void shouldPreserveValidValues() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized(
            "Custom message", 
            "/api/test", 
            "custom-correlation-id"
        );

        // Then
        assertEquals("unauthorized", response.getError());
        assertEquals("Custom message", response.getMessage());
        assertEquals(401, response.getStatus());
        assertEquals("/api/test", response.getPath());
        assertEquals("custom-correlation-id", response.getCorrelationId());
        assertEquals("authentication", response.getCategory());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void shouldCreateConsistentTimestamps() {
        // When
        ErrorResponse response1 = ErrorResponse.unauthorized("Test", "/test", "corr-1");
        ErrorResponse response2 = ErrorResponse.accessDenied("Test", "/test", "corr-2");

        // Then - timestamps should be very close (within 1 second)
        long timeDiff = Math.abs(
            response1.getTimestamp().toEpochSecond() - 
            response2.getTimestamp().toEpochSecond()
        );
        assertTrue(timeDiff <= 1, "Timestamps should be within 1 second of each other");
    }

    @Test
    void shouldHandleWhitespaceOnlyValues() {
        // When
        ErrorResponse response = ErrorResponse.unauthorized("   ", "   ", "   ");

        // Then
        assertEquals("Authentication required to access this resource", response.getMessage());
        assertEquals("/unknown", response.getPath());
        assertEquals("missing-correlation-id", response.getCorrelationId());
    }

    @Test
    void shouldValidateStatusCodeBoundaries() {
        // Test lower boundary
        assertDoesNotThrow(() -> ErrorResponse.of("test", "message", 100));

        // Test upper boundary
        assertDoesNotThrow(() -> ErrorResponse.of("test", "message", 599));

        // Test invalid boundaries
        assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of("test", "message", 99));
        assertThrows(InvalidErrorResponseException.class, () ->
            ErrorResponse.of("test", "message", 600));
    }

    @Test
    void shouldHandleSpecialCharactersInErrorMessages() {
        // When - create error response with special characters
        ErrorResponse response = ErrorResponse.unauthorized(
            "Error with \"quotes\" and \n newlines and \t tabs",
            "/test/path",
            "corr-123"
        );

        // Then - should not throw exception and handle gracefully
        assertNotNull(response);
        assertEquals("unauthorized", response.getError());
        assertTrue(response.getMessage().contains("quotes"));
        assertTrue(response.getMessage().contains("newlines"));
        assertTrue(response.getMessage().contains("tabs"));
    }

    @Test
    void shouldHandleJsonInjectionAttempts() {
        // When - attempt JSON injection in error message
        String maliciousMessage = "Error\",\"injected\":\"value\",\"fake\":\"";
        ErrorResponse response = ErrorResponse.unauthorized(maliciousMessage, "/test", "corr-123");

        // Then - should handle safely without breaking JSON structure
        assertNotNull(response);
        assertEquals("unauthorized", response.getError());
        assertEquals(maliciousMessage, response.getMessage());
    }

    @Test
    void shouldHandleUnicodeCharacters() {
        // When - create error response with unicode characters
        ErrorResponse response = ErrorResponse.unauthorized(
            "Error with unicode: 你好 🌟 café",
            "/test/path",
            "corr-123"
        );

        // Then - should handle unicode gracefully
        assertNotNull(response);
        assertTrue(response.getMessage().contains("你好"));
        assertTrue(response.getMessage().contains("🌟"));
        assertTrue(response.getMessage().contains("café"));
    }

    @Test
    void shouldSanitizeMaliciousPath() {
        // When - create error response with potentially malicious path
        String maliciousPath = "/test/../../../etc/passwd?param=<script>alert('xss')</script>";
        ErrorResponse response = ErrorResponse.unauthorized("Test message", maliciousPath, "corr-123");

        // Then - path should be sanitized
        assertNotNull(response);
        String sanitizedPath = response.getPath();
        assertFalse(sanitizedPath.contains("../"));
        assertFalse(sanitizedPath.contains("<script>"));
        assertTrue(sanitizedPath.startsWith("/"));
    }

    @Test
    void shouldHandleVeryLongPath() {
        // When - create error response with very long path
        String longPath = "/test/" + "a".repeat(300);
        ErrorResponse response = ErrorResponse.unauthorized("Test message", longPath, "corr-123");

        // Then - path should be truncated to reasonable length
        assertNotNull(response);
        assertTrue(response.getPath().length() <= 200);
        assertTrue(response.getPath().startsWith("/"));
    }

    @Test
    void shouldHandlePathWithSpecialCharacters() {
        // When - create error response with path containing special characters
        String pathWithSpecialChars = "/test/path with spaces & symbols!@#$%^&*()";
        ErrorResponse response = ErrorResponse.unauthorized("Test message", pathWithSpecialChars, "corr-123");

        // Then - path should be sanitized but preserve valid characters
        assertNotNull(response);
        String sanitizedPath = response.getPath();
        assertTrue(sanitizedPath.startsWith("/"));
        assertFalse(sanitizedPath.contains(" ")); // Spaces should be removed
        assertFalse(sanitizedPath.contains("!")); // Special chars should be removed
    }

    @Test
    void shouldPreserveValidPathCharacters() {
        // When - create error response with valid path characters
        String validPath = "/api/v1/users/123?param=value&other=test";
        ErrorResponse response = ErrorResponse.unauthorized("Test message", validPath, "corr-123");

        // Then - valid path characters should be preserved
        assertNotNull(response);
        String sanitizedPath = response.getPath();
        assertTrue(sanitizedPath.contains("/api/v1/users/123"));
        assertTrue(sanitizedPath.contains("param=value"));
        assertTrue(sanitizedPath.contains("&"));
        assertTrue(sanitizedPath.contains("?"));
    }
}
