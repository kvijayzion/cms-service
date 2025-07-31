package com.mysillydreams.gateway.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

/**
 * Integration tests for API Gateway filter chain ordering and functionality
 * Tests that each filter (auth, rate-limit, timeout, retry, CB) fires in the right order
 * and returns the expected status codes
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@AutoConfigureWireMock(port = 0)
@ActiveProfiles("test")
public class GatewayFilterChainIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    public void testAuthenticationFilterOrder() {
        // Test that authentication filter runs before rate limiting
        // Unauthenticated request should return 401, not 429 (rate limit)
        
        webTestClient.get()
                .uri("/api/users/profile")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().exists("X-Correlation-ID")
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.error").isEqualTo("Unauthorized")
                .jsonPath("$.message").exists()
                .jsonPath("$.timestamp").exists();
    }

    @Test
    public void testRateLimitingAfterAuthentication() {
        // Mock successful authentication
        stubFor(post(urlEqualTo("/auth/validate"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"valid\":true,\"userId\":\"test-user\"}")));

        // Send multiple requests to trigger rate limiting
        for (int i = 0; i < 15; i++) {
            webTestClient.get()
                    .uri("/api/users/profile")
                    .header("Authorization", "Bearer valid-token")
                    .exchange();
        }

        // Next request should be rate limited
        webTestClient.get()
                .uri("/api/users/profile")
                .header("Authorization", "Bearer valid-token")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
                .expectHeader().exists("X-Correlation-ID");
    }

    @Test
    public void testTimeoutFilter() {
        // Mock slow downstream service
        stubFor(get(urlMatching("/users/.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withFixedDelay(20000))); // 20 second delay

        webTestClient.get()
                .uri("/api/users/profile")
                .header("Authorization", "Bearer valid-token")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.GATEWAY_TIMEOUT)
                .expectHeader().exists("X-Correlation-ID")
                .expectBody()
                .jsonPath("$.error").isEqualTo("Gateway Timeout")
                .jsonPath("$.timeout").exists();
    }

    @Test
    public void testRetryMechanism() {
        // Mock service that fails twice then succeeds
        stubFor(get(urlEqualTo("/users/profile"))
                .inScenario("Retry Test")
                .whenScenarioStateIs("Started")
                .willReturn(aResponse().withStatus(500))
                .willSetStateTo("First Retry"));

        stubFor(get(urlEqualTo("/users/profile"))
                .inScenario("Retry Test")
                .whenScenarioStateIs("First Retry")
                .willReturn(aResponse().withStatus(500))
                .willSetStateTo("Second Retry"));

        stubFor(get(urlEqualTo("/users/profile"))
                .inScenario("Retry Test")
                .whenScenarioStateIs("Second Retry")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"userId\":\"test-user\",\"name\":\"Test User\"}")));

        webTestClient.get()
                .uri("/api/users/profile")
                .header("Authorization", "Bearer valid-token")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().exists("X-Correlation-ID");
    }

    @Test
    public void testCircuitBreakerFallback() {
        // Mock service that always fails to trigger circuit breaker
        stubFor(get(urlMatching("/users/.*"))
                .willReturn(aResponse().withStatus(500)));

        // Make multiple requests to open circuit breaker
        for (int i = 0; i < 10; i++) {
            webTestClient.get()
                    .uri("/api/users/profile")
                    .header("Authorization", "Bearer valid-token")
                    .exchange();
        }

        // Next request should hit circuit breaker fallback
        webTestClient.get()
                .uri("/api/users/profile")
                .header("Authorization", "Bearer valid-token")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
                .expectHeader().exists("X-Correlation-ID")
                .expectBody()
                .jsonPath("$.error").isEqualTo("Service Unavailable")
                .jsonPath("$.message").exists();
    }

    @Test
    public void testCsrfProtection() {
        // Test CSRF protection on protected endpoints
        webTestClient.post()
                .uri("/api/auth/admin/users")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"username\":\"newuser\"}")
                .exchange()
                .expectStatus().isForbidden(); // Should fail without CSRF token
    }

    @Test
    public void testSecurityHeaders() {
        webTestClient.get()
                .uri("/api/health/status")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().exists("X-Correlation-ID")
                .expectHeader().exists("Content-Security-Policy")
                .expectHeader().exists("X-Frame-Options")
                .expectHeader().exists("X-Content-Type-Options")
                .expectHeader().exists("Referrer-Policy")
                .expectHeader().exists("Permissions-Policy")
                .expectHeader().exists("Cross-Origin-Embedder-Policy")
                .expectHeader().exists("Cross-Origin-Opener-Policy")
                .expectHeader().exists("Cross-Origin-Resource-Policy");
    }

    @Test
    public void testCacheControlHeaders() {
        // Test sensitive path gets no-store
        webTestClient.get()
                .uri("/api/auth/admin/users")
                .header("Authorization", "Bearer admin-token")
                .exchange()
                .expectHeader().valueEquals("Cache-Control", "no-store, no-cache, must-revalidate, private");

        // Test static resource gets long-term caching
        webTestClient.get()
                .uri("/favicon.ico")
                .exchange()
                .expectHeader().valueMatches("Cache-Control", ".*max-age=31536000.*");
    }

    @Test
    public void testCorrelationIdPropagation() {
        String correlationId = "test-correlation-123";
        
        webTestClient.get()
                .uri("/api/health/status")
                .header("X-Correlation-ID", correlationId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Correlation-ID", correlationId);
    }

    @Test
    public void testMetricsCollection() {
        // Make a request to generate metrics
        webTestClient.get()
                .uri("/api/health/status")
                .exchange()
                .expectStatus().isOk();

        // Check that metrics endpoint exposes gateway metrics
        webTestClient.get()
                .uri("/actuator/metrics/gateway.requests.total")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.name").isEqualTo("gateway.requests.total")
                .jsonPath("$.measurements").isArray();
    }
}
