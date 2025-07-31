package com.mysillydreams.gateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.dto.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Tests for AbstractErrorHandler focusing on JSON escaping and security
 */
@ExtendWith(MockitoExtension.class)
class AbstractErrorHandlerTest {

    @Mock
    private ServerWebExchange exchange;
    
    @Mock
    private ServerHttpRequest request;
    
    @Mock
    private ServerHttpResponse response;

    private TestableAbstractErrorHandler errorHandler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        errorHandler = new TestableAbstractErrorHandler(objectMapper, "test-realm");
        
        when(exchange.getRequest()).thenReturn(request);
        when(exchange.getResponse()).thenReturn(response);
    }

    @Test
    void shouldEscapeJsonSpecialCharacters() throws Exception {
        // Given
        String inputWithSpecialChars = "Error with \"quotes\" and \n newlines and \t tabs";
        
        // When
        String escaped = invokeEscapeJsonString(inputWithSpecialChars);
        
        // Then
        assertEquals("Error with \\\"quotes\\\" and \\n newlines and \\t tabs", escaped);
    }

    @Test
    void shouldEscapeBackslashes() throws Exception {
        // Given
        String inputWithBackslashes = "Path: C:\\Users\\test\\file.txt";
        
        // When
        String escaped = invokeEscapeJsonString(inputWithBackslashes);
        
        // Then
        assertEquals("Path: C:\\\\Users\\\\test\\\\file.txt", escaped);
    }

    @Test
    void shouldHandleNullInput() throws Exception {
        // When
        String escaped = invokeEscapeJsonString(null);
        
        // Then
        assertEquals("", escaped);
    }

    @Test
    void shouldHandleEmptyString() throws Exception {
        // When
        String escaped = invokeEscapeJsonString("");
        
        // Then
        assertEquals("", escaped);
    }

    @Test
    void shouldEscapeAllControlCharacters() throws Exception {
        // Given
        String inputWithControlChars = "Test\b\f\r\n\t";
        
        // When
        String escaped = invokeEscapeJsonString(inputWithControlChars);
        
        // Then
        assertEquals("Test\\b\\f\\r\\n\\t", escaped);
    }

    @Test
    void shouldCreateValidFallbackJson() throws Exception {
        // Given
        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("test_error")
                .message("Test message with \"quotes\"")
                .status(400)
                .path("/test/path")
                .correlationId("corr-123")
                .retryAfter("PT30S")
                .supportContact("support@test.com")
                .category("test")
                .build();
        
        // When
        String fallbackJson = invokeCreateFallbackJson(errorResponse);
        
        // Then
        assertNotNull(fallbackJson);
        assertTrue(fallbackJson.contains("\"error\":\"test_error\""));
        assertTrue(fallbackJson.contains("\"message\":\"Test message with \\\"quotes\\\"\""));
        assertTrue(fallbackJson.contains("\"status\":400"));
        assertTrue(fallbackJson.contains("\"path\":\"/test/path\""));
        assertTrue(fallbackJson.contains("\"correlationId\":\"corr-123\""));
        
        // Verify it's valid JSON by parsing it
        assertDoesNotThrow(() -> objectMapper.readTree(fallbackJson));
    }

    @Test
    void shouldHandleJsonInjectionAttempt() throws Exception {
        // Given - malicious input attempting JSON injection
        String maliciousInput = "Error\",\"injected\":\"malicious\",\"fake\":\"";
        
        // When
        String escaped = invokeEscapeJsonString(maliciousInput);
        
        // Then
        assertEquals("Error\\\",\\\"injected\\\":\\\"malicious\\\",\\\"fake\\\":\\\"", escaped);
        
        // Verify the escaped string doesn't break JSON structure
        String testJson = String.format("{\"message\":\"%s\"}", escaped);
        assertDoesNotThrow(() -> objectMapper.readTree(testJson));
    }

    @Test
    void shouldCleanUpMDCAfterLogging() {
        // Given
        String correlationId = "test-correlation-id";
        String userId = "test-user-id";
        String username = "test-username";
        String roles = "USER,ADMIN";
        
        // When
        errorHandler.logErrorWithUserContextAndRoles(
            "Test message", 403, correlationId, userId, username, roles, null);
        
        // Then - MDC should be cleaned up
        assertNull(MDC.get("correlationId"));
        assertNull(MDC.get("userId"));
        assertNull(MDC.get("username"));
        assertNull(MDC.get("userRoles"));
        assertNull(MDC.get("httpStatus"));
    }

    @Test
    void shouldHandleNullValuesInUserContext() {
        // When/Then - should not throw exception with null values
        assertDoesNotThrow(() -> 
            errorHandler.logErrorWithUserContextAndRoles(
                "Test message", 403, null, null, null, null, null));
    }

    // Helper methods to access private methods via reflection
    private String invokeEscapeJsonString(String input) throws Exception {
        Method method = AbstractErrorHandler.class.getDeclaredMethod("escapeJsonString", String.class);
        method.setAccessible(true);
        return (String) method.invoke(errorHandler, input);
    }

    private String invokeCreateFallbackJson(ErrorResponse errorResponse) throws Exception {
        Method method = AbstractErrorHandler.class.getDeclaredMethod("createFallbackJson", ErrorResponse.class);
        method.setAccessible(true);
        return (String) method.invoke(errorHandler, errorResponse);
    }

    // Testable implementation of AbstractErrorHandler
    private static class TestableAbstractErrorHandler extends AbstractErrorHandler {
        public TestableAbstractErrorHandler(ObjectMapper objectMapper, String realm) {
            super(objectMapper, realm);
        }
    }
}
