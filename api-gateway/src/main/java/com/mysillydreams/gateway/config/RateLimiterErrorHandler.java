package com.mysillydreams.gateway.config;

import com.mysillydreams.gateway.constants.HeaderConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Custom error handler for rate limiting responses
 * Provides structured JSON responses with proper headers for 429 errors
 */
@Component
@Order(-1)  // High priority to handle rate limit errors
@Slf4j
@RequiredArgsConstructor
public class RateLimiterErrorHandler implements ErrorWebExceptionHandler {

    private final GatewayProperties gatewayProperties;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        // Only handle rate limiting errors
        if (!(ex instanceof ResponseStatusException) || 
            ((ResponseStatusException) ex).getStatusCode() != HttpStatus.TOO_MANY_REQUESTS) {
            return Mono.error(ex);
        }

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // Add rate limiting headers
        response.getHeaders().set(HeaderConstants.RETRY_AFTER, 
            gatewayProperties.getFallback().getRetryAfter().toString());
        response.getHeaders().set(HeaderConstants.CACHE_CONTROL, 
            "no-cache, no-store, must-revalidate");

        // Add correlation ID if present
        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);
        if (correlationId != null) {
            response.getHeaders().set(HeaderConstants.X_CORRELATION_ID, correlationId);
        }

        // Create structured JSON response
        String jsonResponse = createRateLimitResponse(exchange, correlationId);
        DataBuffer buffer = response.bufferFactory().wrap(jsonResponse.getBytes(StandardCharsets.UTF_8));

        log.warn("Rate limit exceeded for path={}, method={}, correlationId={}", 
            exchange.getRequest().getPath().value(),
            exchange.getRequest().getMethod().name(),
            correlationId);

        return response.writeWith(Mono.just(buffer));
    }

    private String createRateLimitResponse(ServerWebExchange exchange, String correlationId) {
        String path = exchange.getRequest().getPath().value();
        String timestamp = OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"timestamp\":\"").append(timestamp).append("\",");
        json.append("\"status\":").append(HttpStatus.TOO_MANY_REQUESTS.value()).append(",");
        json.append("\"error\":\"Too Many Requests\",");
        json.append("\"message\":\"Rate limit exceeded. Please try again later.\",");
        json.append("\"path\":\"").append(path).append("\",");
        
        if (correlationId != null) {
            json.append("\"correlationId\":\"").append(correlationId).append("\",");
        }
        
        json.append("\"retryAfter\":\"").append(gatewayProperties.getFallback().getRetryAfterMessage()).append("\",");
        json.append("\"supportContact\":\"").append(gatewayProperties.getFallback().getSupportContact()).append("\"");
        json.append("}");
        
        return json.toString();
    }
}
