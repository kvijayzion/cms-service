package com.mysillydreams.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.config.TimeoutProperties;
import com.mysillydreams.gateway.constants.HeaderConstants;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.concurrent.TimeoutException;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Global timeout filter that applies a sensible timeout to every request chain.
 * Maps timeouts to HTTP 504 Gateway Timeout to prevent slow or hanging upstream calls
 * from tying up gateway threads.
 * Note: Registered as @Bean in SecurityConfig, not @Component to avoid double registration
 */
@RequiredArgsConstructor
public class GlobalTimeoutFilter implements WebFilter {

    private static final Logger logger = LoggerFactory.getLogger(GlobalTimeoutFilter.class);
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final TimeoutProperties timeoutProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // All configuration now injected via TimeoutProperties

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip timeout for configured excluded paths
        if (isExcludedPath(path)) {
            return chain.filter(exchange);
        }

        // Extract correlation ID for MDC context propagation
        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);

        // Determine timeout for this specific path
        Duration timeout = getTimeoutForPath(path);

        return chain.filter(exchange)
                .timeout(timeout)
                // Use Reactor's timeout-only matcher
                .onErrorResume(TimeoutException.class, ex -> {
                    // Log with correlation ID from context if available
                    return Mono.deferContextual(ctx -> {
                        String ctxCorrelationId = ctx.getOrDefault("correlationId", correlationId);

                        if (timeoutProperties.isLoggingEnabled()) {
                            logger.warn("Request timeout after {} for path: {}, correlationId: {}",
                                       timeout, path, ctxCorrelationId);
                        }

                        // Instrument timeout counter if enabled
                        if (timeoutProperties.isMetricsEnabled()) {
                            meterRegistry.counter("gateway.timeout.count",
                                "path", sanitizePath(path))
                                .increment();
                        }

                        return handleTimeout(exchange, ex, timeout);
                    });
                })
                // Propagate MDC context in reactive chain using Reactor Context
                .contextWrite(ctx -> {
                    if (correlationId != null) {
                        return ctx.put("correlationId", correlationId);
                    }
                    return ctx;
                });
    }

    private Mono<Void> handleTimeout(ServerWebExchange exchange, Throwable ex, Duration timeout) {
        ServerHttpResponse response = exchange.getResponse();

        // Check if response is already committed
        if (response.isCommitted()) {
            logger.warn("Cannot handle timeout - response already committed for path: {}",
                       exchange.getRequest().getPath().value());
            return Mono.empty();
        }

        // Extract correlation ID for response
        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);

        // Move all header application into beforeCommit exclusively
        response.beforeCommit(() -> {
            // Set proper HTTP status and headers
            response.setStatusCode(HttpStatus.GATEWAY_TIMEOUT);
            response.getHeaders().set(HeaderConstants.RETRY_AFTER, timeoutProperties.getRetryAfter().toString());
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            response.getHeaders().set(HeaderConstants.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

            // Add correlation ID header if present
            if (correlationId != null) {
                response.getHeaders().set(HeaderConstants.X_CORRELATION_ID, correlationId);
            }

            return Mono.empty();
        });

        return Mono.defer(() -> {
            // Create timeout response body with externalized template
            String jsonResponse = createTimeoutResponse(exchange, correlationId, timeout);
            DataBuffer buffer = response.bufferFactory().wrap(jsonResponse.getBytes());

            // Release buffer on error to prevent memory leaks
            return response.writeWith(Mono.just(buffer))
                    .doOnError(error -> DataBufferUtils.release(buffer));
        });
    }

    /**
     * Create timeout response using externalized template
     */
    private String createTimeoutResponse(ServerWebExchange exchange, String correlationId, Duration timeout) {
        String template = timeoutProperties.getErrorTemplate();
        String path = exchange.getRequest().getPath().value();
        String timestamp = OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        return template
                .replace("{timeout}", timeout.toString())
                .replace("{path}", path)
                .replace("{correlationId}", correlationId != null ? correlationId : "")
                .replace("{timestamp}", timestamp)
                .replace("{retryAfter}", timeoutProperties.getRetryAfter().toString());
    }

    /**
     * Check if the path should be excluded from timeout handling using configurable patterns
     */
    private boolean isExcludedPath(String path) {
        return timeoutProperties.getExcludePaths().stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    /**
     * Get timeout duration for a specific path, checking custom timeouts first,
     * then per-route timeout, then global timeout
     */
    private Duration getTimeoutForPath(String path) {
        return timeoutProperties.getCustomTimeouts().entrySet().stream()
                .filter(entry -> pathMatcher.match(entry.getKey(), path))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(timeoutProperties.getPerRouteTimeout());
    }

    /**
     * Sanitize path for metrics to avoid high cardinality
     */
    private String sanitizePath(String path) {
        return path.replaceAll("/\\d+", "/{id}")
                  .replaceAll("/[a-f0-9-]{36}", "/{uuid}")
                  .replaceAll("/[a-f0-9]{8,}", "/{hash}");
    }
}
