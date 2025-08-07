package com.mysillydreams.gateway.filter;

import com.mysillydreams.gateway.config.SecurityHeadersProperties;
import com.mysillydreams.gateway.constants.HeaderConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Security headers filter that applies security headers to all responses
 * Includes CSP with nonce generation, HSTS, frame options, and other security headers
 * Order: Run very early to ensure headers are applied before any other processing
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)  // Ensure headers go out before error handlers and tracing
@Slf4j
@RequiredArgsConstructor
public class SecurityHeadersFilter implements WebFilter {

    private final SecurityHeadersProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // Configuration now injected via SecurityHeadersProperties

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip security headers for internal endpoints
        if (isInternalEndpoint(path)) {
            return chain.filter(exchange);
        }

        // Use response.beforeCommit to ensure headers are set before body
        exchange.getResponse().beforeCommit(() -> {
            addSecurityHeaders(exchange);
            return Mono.empty();
        });

        return chain.filter(exchange);
    }

    /**
     * Check if path is an internal endpoint that should skip security headers
     * Uses configurable patterns from SecurityHeadersProperties
     */
    private boolean isInternalEndpoint(String path) {
        return properties.getExcludePaths().stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private void addSecurityHeaders(ServerWebExchange exchange) {
        var headers = exchange.getResponse().getHeaders();

        // Generate and add CSP nonce (idempotent header writes)
        if (properties.getCsp().isEnabled()) {
            String nonce = generateNonce();
            exchange.getAttributes().put(HeaderConstants.CSP_NONCE_ATTRIBUTE, nonce);

            String cspPolicy = buildCspPolicy(nonce);
            String cspHeader = properties.getCsp().isReportOnly() ?
                HeaderConstants.CONTENT_SECURITY_POLICY_REPORT_ONLY :
                HeaderConstants.CONTENT_SECURITY_POLICY;

            if (!headers.containsKey(cspHeader)) {
                headers.set(cspHeader, cspPolicy);
            }
        }

        // Add HSTS header (idempotent)
        if (properties.getHsts().isEnabled() && !headers.containsKey(HeaderConstants.STRICT_TRANSPORT_SECURITY)) {
            StringBuilder hstsValue = new StringBuilder("max-age=").append(properties.getHsts().getMaxAge());
            if (properties.getHsts().isIncludeSubdomains()) {
                hstsValue.append("; includeSubDomains");
            }
            if (properties.getHsts().isPreload()) {
                hstsValue.append("; preload");
            }
            headers.set(HeaderConstants.STRICT_TRANSPORT_SECURITY, hstsValue.toString());
        }

        // Add other security headers (idempotent)
        if (!headers.containsKey(HeaderConstants.X_FRAME_OPTIONS)) {
            headers.set(HeaderConstants.X_FRAME_OPTIONS, properties.getFrameOptions());
        }
        if (!headers.containsKey(HeaderConstants.X_CONTENT_TYPE_OPTIONS)) {
            headers.set(HeaderConstants.X_CONTENT_TYPE_OPTIONS, properties.getContentTypeOptions());
        }
        if (!headers.containsKey(HeaderConstants.REFERRER_POLICY)) {
            headers.set(HeaderConstants.REFERRER_POLICY, properties.getReferrerPolicy());
        }
        if (!headers.containsKey(HeaderConstants.CROSS_ORIGIN_EMBEDDER_POLICY)) {
            headers.set(HeaderConstants.CROSS_ORIGIN_EMBEDDER_POLICY, "require-corp");
        }
        if (!headers.containsKey(HeaderConstants.CROSS_ORIGIN_OPENER_POLICY)) {
            headers.set(HeaderConstants.CROSS_ORIGIN_OPENER_POLICY, "same-origin");
        }
        if (!headers.containsKey(HeaderConstants.CROSS_ORIGIN_RESOURCE_POLICY)) {
            headers.set(HeaderConstants.CROSS_ORIGIN_RESOURCE_POLICY, "same-origin");
        }
        if (!headers.containsKey(HeaderConstants.PERMISSIONS_POLICY)) {
            headers.set(HeaderConstants.PERMISSIONS_POLICY, "geolocation=(), microphone=(), camera=()");
        }
    }

    /**
     * Generate a cryptographically secure nonce for CSP
     */
    public String generateNonce() {
        byte[] nonceBytes = new byte[properties.getCsp().getNonceLength()];
        secureRandom.nextBytes(nonceBytes);
        return Base64.getEncoder().encodeToString(nonceBytes);
    }

    /**
     * Build Content Security Policy with nonce using configurable template
     */
    private String buildCspPolicy(String nonce) {
        return String.format(properties.getCsp().getPolicy(), nonce);
    }
}
