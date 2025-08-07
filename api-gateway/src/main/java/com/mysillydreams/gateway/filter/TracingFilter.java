package com.mysillydreams.gateway.filter;

import com.mysillydreams.gateway.config.TracingProperties;
import com.mysillydreams.gateway.constants.HeaderConstants;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.TraceContext;
import io.micrometer.tracing.Tracer;
// import io.micrometer.tracing.propagation.TraceContext; // Not needed for current implementation
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.Optional;

/**
 * Tracing filter for distributed tracing across gateway
 * Enhanced: Proper span lifecycle management and context propagation
 * Order: Run early to wrap entire request processing
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)  // After security headers, before other filters
@RequiredArgsConstructor
public class TracingFilter implements GatewayFilter {

    private static final Logger logger = LoggerFactory.getLogger(TracingFilter.class);

    private final Tracer tracer;
    private final TracingProperties tracingProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // Skip tracing of internal endpoints if tracing is enabled
        if (!tracingProperties.isEnabled() || isInternalEndpoint(path)) {
            return chain.filter(exchange);
        }

        // Propagate ReactorContext with trace span
        return Mono.deferContextual(ctx -> {
            // Create a new span for the gateway request
            Span span = tracer.nextSpan()
                    .name("gateway.request")
                    .tag("http.method", request.getMethod().name())
                    .tag("http.path", tracingProperties.isPathSanitization() ? sanitizePath(path) : path)
                    .start();

            // Tag correlation ID on the span if enabled
            if (tracingProperties.isCorrelationIdTagging()) {
                Optional.ofNullable(request.getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID))
                        .ifPresent(id -> span.tag("correlationId", id));
            }

            // Add trace headers based on configuration
            ServerHttpRequest.Builder requestBuilder = request.mutate();

            if (tracingProperties.isW3cTraceContext()) {
                requestBuilder.header(HeaderConstants.TRACEPARENT, generateTraceParent(span));
            }

            if (tracingProperties.isCustomTraceHeaders()) {
                requestBuilder.header(HeaderConstants.TRACE_ID, span.context().traceId())
                             .header(HeaderConstants.SPAN_ID, span.context().spanId());
            }

            ServerHttpRequest modifiedRequest = requestBuilder.build();

            ServerWebExchange modifiedExchange = exchange.mutate().request(modifiedRequest).build();

            // Store span in exchange attributes for downstream access
            modifiedExchange.getAttributes().put(HeaderConstants.TRACE_CONTEXT_ATTRIBUTE, span.context());

            return chain.filter(modifiedExchange)
                    .contextWrite(Context.of(TraceContext.class, span.context()))
                    .doFinally(signal -> {
                        // Add HTTP status and error tags in finally block
                        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
                        if (statusCode != null) {
                            span.tag("http.status_code", String.valueOf(statusCode.value()));
                            if (statusCode.isError()) {
                                span.tag("error", "true");
                            }
                        }

                        // Add signal type for debugging
                        span.tag("reactor.signal", signal.toString());

                        // End the span
                        span.end();
                    });
        });
    }

    /**
     * Sanitize path to avoid high cardinality in tracing
     */
    private String sanitizePath(String path) {
        return path.replaceAll("/\\d+", "/{id}")
                  .replaceAll("/[a-f0-9-]{36}", "/{uuid}")
                  .replaceAll("/[a-f0-9]{8,}", "/{hash}");
    }

    /**
     * Check if path is an internal endpoint that should skip full tracing
     */
    private boolean isInternalEndpoint(String path) {
        return tracingProperties.getExcludePaths().stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    /**
     * Generate W3C TraceContext traceparent header
     */
    private String generateTraceParent(Span span) {
        return String.format("00-%s-%s-01",
            span.context().traceId(),
            span.context().spanId());
    }
}
