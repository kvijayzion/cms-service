package com.mysillydreams.gateway.constants;

/**
 * Constants for HTTP headers used throughout the API Gateway
 * Centralizes header names to avoid typos and ensure consistency
 */
public final class HeaderConstants {

    private HeaderConstants() {
        // Utility class - prevent instantiation
    }

    /**
     * Correlation ID header for request tracing
     */
    public static final String X_CORRELATION_ID = "X-Correlation-ID";

    /**
     * CSRF token header
     */
    public static final String X_XSRF_TOKEN = "X-XSRF-TOKEN";

    /**
     * Real IP header for rate limiting
     */
    public static final String X_REAL_IP = "X-Real-IP";

    /**
     * Forwarded for header for rate limiting
     */
    public static final String X_FORWARDED_FOR = "X-Forwarded-For";

    /**
     * Authorization header
     */
    public static final String AUTHORIZATION = "Authorization";

    /**
     * Content type header
     */
    public static final String CONTENT_TYPE = "Content-Type";

    /**
     * User agent header
     */
    public static final String USER_AGENT = "User-Agent";

    /**
     * Request ID header for internal service communication
     */
    public static final String X_REQUEST_ID = "X-Request-ID";

    /**
     * Cache control header
     */
    public static final String CACHE_CONTROL = "Cache-Control";

    /**
     * Retry after header
     */
    public static final String RETRY_AFTER = "Retry-After";

    /**
     * Rate limiting headers
     */
    public static final String X_RATE_LIMIT_REMAINING = "X-RateLimit-Remaining";
    public static final String X_RATE_LIMIT_RESET = "X-RateLimit-Reset";
    public static final String X_RATE_LIMIT_LIMIT = "X-RateLimit-Limit";

    /**
     * Security headers
     */
    public static final String STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security";
    public static final String CONTENT_SECURITY_POLICY = "Content-Security-Policy";
    public static final String CONTENT_SECURITY_POLICY_REPORT_ONLY = "Content-Security-Policy-Report-Only";
    public static final String X_FRAME_OPTIONS = "X-Frame-Options";
    public static final String X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    public static final String REFERRER_POLICY = "Referrer-Policy";
    public static final String CROSS_ORIGIN_EMBEDDER_POLICY = "Cross-Origin-Embedder-Policy";
    public static final String CROSS_ORIGIN_OPENER_POLICY = "Cross-Origin-Opener-Policy";
    public static final String CROSS_ORIGIN_RESOURCE_POLICY = "Cross-Origin-Resource-Policy";
    public static final String PERMISSIONS_POLICY = "Permissions-Policy";

    /**
     * Gateway user information headers
     */
    public static final String X_USER_ID = "X-User-Id";
    public static final String X_USERNAME = "X-Username";
    public static final String X_USER_ROLES = "X-User-Roles";
    public static final String X_GATEWAY_VALIDATED = "X-Gateway-Validated";

    /**
     * Tracing headers
     */
    public static final String TRACEPARENT = "traceparent";
    public static final String TRACESTATE = "tracestate";
    public static final String TRACE_ID = "X-Trace-Id";
    public static final String SPAN_ID = "X-Span-Id";

    /**
     * Filter constants
     */
    public static final String CSP_NONCE_ATTRIBUTE = "csp-nonce";
    public static final String TRACE_CONTEXT_ATTRIBUTE = "trace-context";
}
