package com.mysillydreams.gateway.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Metrics and monitoring configuration for API Gateway
 * Provides Micrometer counters for rate-limit hits, circuit-breaker opens,
 * timeout events, and correlation ID tracking
 */
@Configuration
public class MetricsConfiguration {

    /**
     * Metrics collection filter for gateway operations
     * Fixed: High precedence to run before auth/rate-limit/timeout filters
     */
    @Bean
    @Order(-200)  // Very high precedence - before all other filters
    public WebFilter metricsFilter(MeterRegistry meterRegistry) {
        return new GatewayMetricsFilter(meterRegistry);
    }

    /**
     * Gateway metrics filter implementation
     */
    public static class GatewayMetricsFilter implements WebFilter {

        private final MeterRegistry meterRegistry;
        private final Counter requestCounter;
        private final Counter rateLimitHitCounter;
        private final Counter timeoutCounter;
        private final Counter circuitBreakerOpenCounter;
        private final Timer requestTimer;

        public GatewayMetricsFilter(MeterRegistry meterRegistry) {
            this.meterRegistry = meterRegistry;
            this.requestCounter = Counter.builder("gateway.requests.total")
                    .description("Total number of requests processed by gateway")
                    .register(meterRegistry);

            this.rateLimitHitCounter = Counter.builder("gateway.ratelimit.hits")
                    .description("Number of requests that hit rate limits")
                    .register(meterRegistry);

            this.timeoutCounter = Counter.builder("gateway.timeouts.total")
                    .description("Number of requests that timed out")
                    .register(meterRegistry);

            this.circuitBreakerOpenCounter = Counter.builder("gateway.circuitbreaker.opens")
                    .description("Number of circuit breaker opens")
                    .register(meterRegistry);

            this.requestTimer = Timer.builder("gateway.request.duration")
                    .description("Request processing time")
                    .register(meterRegistry);
        }

        @Override
        public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
            String path = exchange.getRequest().getPath().value();

            // Fixed: Exclude actuator endpoints from metrics and rate limiting
            if (this.isActuatorEndpoint(path)) {
                return chain.filter(exchange);
            }

            // Use Timer.Sample for cleaner duration recording
            Timer.Sample sample = Timer.start(meterRegistry);
            String method = exchange.getRequest().getMethod().name();

            // Generate correlation ID if not present
            String correlationId = exchange.getRequest().getHeaders().getFirst("X-Correlation-ID");
            if (correlationId == null) {
                correlationId = java.util.UUID.randomUUID().toString();
                exchange.getAttributes().put("correlationId", correlationId);
            }

            // Add correlation ID to response headers
            exchange.getResponse().getHeaders().add("X-Correlation-ID", correlationId);

            // Increment request counter with method tag
            Counter.builder("gateway.requests.total")
                    .tag("method", method)
                    .tag("path", sanitizePath(path))
                    .description("Total number of requests processed by gateway")
                    .register(meterRegistry)
                    .increment();

            return chain.filter(exchange)
                    .doFinally(signalType -> {
                        // Record request duration with rich tags
                        int statusCode = exchange.getResponse().getStatusCode() != null ?
                            exchange.getResponse().getStatusCode().value() : 0;

                        sample.stop(Timer.builder("gateway.request.duration")
                                .tags("method", method,
                                      "status", String.valueOf(statusCode),
                                      "path", sanitizePath(path))
                                .description("Request processing time")
                                .register(meterRegistry));

                        // Record specific error metrics with tags
                        if (statusCode == 429) {
                            Counter.builder("gateway.ratelimit.hits")
                                    .tag("method", method)
                                    .tag("path", sanitizePath(path))
                                    .description("Number of requests that hit rate limits")
                                    .register(meterRegistry)
                                    .increment();
                        }

                        if (statusCode == 503) {
                            Counter.builder("gateway.circuitbreaker.opens")
                                    .tag("method", method)
                                    .tag("path", sanitizePath(path))
                                    .description("Number of circuit breaker opens")
                                    .register(meterRegistry)
                                    .increment();
                        }

                        if (statusCode >= 500) {
                            Counter.builder("gateway.errors.total")
                                    .tag("method", method)
                                    .tag("status", String.valueOf(statusCode))
                                    .tag("path", sanitizePath(path))
                                    .description("Total number of server errors")
                                    .register(meterRegistry)
                                    .increment();
                        }
                    });
        }

        /**
         * Sanitize path for metrics to avoid high cardinality
         */
        private String sanitizePath(String path) {
            // Replace dynamic path segments with placeholders
            return path.replaceAll("/\\d+", "/{id}")
                      .replaceAll("/[a-f0-9-]{36}", "/{uuid}")
                      .replaceAll("/[a-f0-9]{8,}", "/{hash}");
        }

        /**
         * Check if path is an actuator endpoint that should be excluded from metrics and rate limiting
         */
        private boolean isActuatorEndpoint(String path) {
            return path.startsWith("/actuator/") ||
                   path.equals("/actuator") ||
                   path.startsWith("/api/health/") ||
                   path.equals("/health");
        }
    }

    /**
     * Custom metrics for rate limiting
     */
    @Bean
    public Counter rateLimitCounter(MeterRegistry meterRegistry) {
        return Counter.builder("gateway.ratelimit.requests")
                .description("Requests processed by rate limiter")
                .register(meterRegistry);
    }

    /**
     * Custom metrics for authentication
     */
    @Bean
    public Counter authenticationCounter(MeterRegistry meterRegistry) {
        return Counter.builder("gateway.authentication.attempts")
                .description("Authentication attempts")
                .register(meterRegistry);
    }

    /**
     * Custom metrics for circuit breaker
     */
    @Bean
    public Counter circuitBreakerCounter(MeterRegistry meterRegistry) {
        return Counter.builder("gateway.circuitbreaker.calls")
                .description("Circuit breaker calls")
                .register(meterRegistry);
    }

    /**
     * Custom metrics for fallback responses
     * Note: Fallback metrics are now created dynamically in FallbackController
     * with proper service tagging using MeterRegistry directly
     */


}
