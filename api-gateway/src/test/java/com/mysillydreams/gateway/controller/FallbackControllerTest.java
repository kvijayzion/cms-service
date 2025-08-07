package com.mysillydreams.gateway.controller;

import com.mysillydreams.gateway.constants.HeaderConstants;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test class for FallbackController hardening improvements
 * Tests the unified fallback handler with proper service mapping and metrics
 */
class FallbackControllerTest {

    private FallbackController fallbackController;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        fallbackController = new FallbackController(meterRegistry);
        
        // Set configuration values using reflection
        ReflectionTestUtils.setField(fallbackController, "retryAfter", Duration.ofSeconds(30));
        ReflectionTestUtils.setField(fallbackController, "retryAfterMessage", "30 seconds");
        ReflectionTestUtils.setField(fallbackController, "supportContact", "support@mysillydreams.com");
        ReflectionTestUtils.setField(fallbackController, "exposeDetails", false);
        ReflectionTestUtils.setField(fallbackController, "errorMessage", "Service Unavailable");
        ReflectionTestUtils.setField(fallbackController, "unavailableSuffix", " is temporarily unavailable");
    }

    @Test
    void testAuthServiceFallback() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/auth/login");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("auth", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("service")).isEqualTo("auth-service");
        assertThat(body.get("message")).isEqualTo("Authentication Service is temporarily unavailable");
        assertThat(body.get("error")).isEqualTo("Service Unavailable");
        assertThat(body.get("path")).isEqualTo("/api/auth/login");
        assertThat(body.get("retryAfter")).isEqualTo("30 seconds");
        assertThat(body.get("supportContact")).isEqualTo("support@mysillydreams.com");
        
        // Verify headers - now using ISO-8601 format
        assertThat(response.getHeaders().getFirst(HeaderConstants.RETRY_AFTER)).isEqualTo("PT30S");
        assertThat(response.getHeaders().getFirst(HeaderConstants.CACHE_CONTROL)).isEqualTo("no-cache, no-store, must-revalidate");
    }

    @Test
    void testUserServiceFallback() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/user/profile");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("user", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("service")).isEqualTo("user-service");
        assertThat(body.get("message")).isEqualTo("User Service is temporarily unavailable");
    }

    @Test
    void testAdminServiceFallback() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/admin/users");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("admin", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("service")).isEqualTo("admin-server");
        assertThat(body.get("message")).isEqualTo("Admin Service is temporarily unavailable");
    }

    @Test
    void testConfigServiceFallback() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/config/properties");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("config", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("service")).isEqualTo("zookeeper-service");
        assertThat(body.get("message")).isEqualTo("Configuration Service is temporarily unavailable");
    }

    @Test
    void testDefaultFallback() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/unknown/endpoint");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("default", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("service")).isEqualTo("unknown");
        assertThat(body.get("message")).isEqualTo("Downstream Service is temporarily unavailable");
    }

    @Test
    void testCorrelationIdPropagation() {
        // Given
        String correlationId = "test-correlation-123";
        ServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/auth/login")
                .header(HeaderConstants.X_CORRELATION_ID, correlationId)
                .build()
        );

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("auth", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("correlationId")).isEqualTo(correlationId);
        
        // Verify correlation ID is propagated in response headers
        assertThat(response.getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID)).isEqualTo(correlationId);
    }

    @Test
    void testMetricsIncrement() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/auth/login");

        // When
        fallbackController.fallback("auth", exchange).block();

        // Then
        // Verify that a counter was created and incremented with rich tags
        assertThat(meterRegistry.getMeters()).isNotEmpty();
        assertThat(meterRegistry.counter("gateway.fallback.count",
            "service", "auth-service",
            "method", "GET",
            "status", "503").count()).isEqualTo(1.0);
    }

    @Test
    void testTimestampFormat() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/auth/login");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("auth", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();

        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();

        String timestamp = (String) body.get("timestamp");
        assertThat(timestamp).isNotNull();
        // Verify ISO-8601 format with timezone
        assertThat(timestamp).matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d+Z");
    }

    @Test
    void testInvalidServiceNameValidation() {
        // Given
        ServerWebExchange exchange = createMockExchange("/api/invalid/endpoint");

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("invalid", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("error")).isEqualTo("Not Found");
        assertThat(body.get("message")).isEqualTo("Fallback service 'invalid' not found");
        assertThat(body.get("path")).isEqualTo("/api/invalid/endpoint");

        // Verify headers
        assertThat(response.getHeaders().getFirst(HeaderConstants.CACHE_CONTROL)).isEqualTo("no-cache, no-store, must-revalidate");
    }

    @Test
    void testHeaderConstantsUsage() {
        // Given
        String correlationId = "test-header-constants-123";
        ServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/auth/login")
                .header(HeaderConstants.X_CORRELATION_ID, correlationId)
                .build()
        );

        // When
        Mono<ResponseEntity<Map<String, Object>>> result = fallbackController.fallback("auth", exchange);

        // Then
        ResponseEntity<Map<String, Object>> response = result.block();
        assertThat(response).isNotNull();

        // Verify header constants are used correctly
        assertThat(response.getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID)).isEqualTo(correlationId);

        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("correlationId")).isEqualTo(correlationId);
    }

    private ServerWebExchange createMockExchange(String path) {
        return MockServerWebExchange.from(MockServerHttpRequest.get(path).build());
    }
}
