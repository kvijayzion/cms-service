package com.mysillydreams.gateway.config;

import com.mysillydreams.gateway.config.properties.RateLimiterProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Fixed: Enhanced rate limiting configuration using @ConfigurationProperties
 * and proper key resolver implementations
 */
@Configuration
public class RateLimitingConfiguration {

    @Autowired
    private RateLimiterProperties rateLimiterProperties;

    // Fixed: Cache for CIDR parsing to avoid performance issues
    private final Map<String, Boolean> cidrCache = new ConcurrentHashMap<>();

    /**
     * Default rate limiter for general requests
     */
    @Bean
    @Primary
    public RedisRateLimiter primaryDefaultRateLimiter() {
        RateLimiterProperties.Default config = rateLimiterProperties.getDefault();
        return new RedisRateLimiter(config.getReplenishRate(), config.getBurstCapacity(), config.getRequestedTokens());
    }

    /**
     * Strict rate limiter for authentication endpoints
     */
    @Bean("authRedisRateLimiter")
    public RedisRateLimiter authRedisRateLimiter() {
        RateLimiterProperties.Auth config = rateLimiterProperties.getAuth();
        return new RedisRateLimiter(config.getReplenishRate(), config.getBurstCapacity(), config.getRequestedTokens());
    }

    /**
     * Permissive rate limiter for authenticated API requests
     */
    @Bean("apiRedisRateLimiter")
    public RedisRateLimiter apiRedisRateLimiter() {
        RateLimiterProperties.Api config = rateLimiterProperties.getApi();
        return new RedisRateLimiter(config.getReplenishRate(), config.getBurstCapacity(), config.getRequestedTokens());
    }

    /**
     * Moderate rate limiter for admin endpoints
     */
    @Bean("adminRedisRateLimiter")
    public RedisRateLimiter adminRedisRateLimiter() {
        RateLimiterProperties.Admin config = rateLimiterProperties.getAdmin();
        return new RedisRateLimiter(config.getReplenishRate(), config.getBurstCapacity(), config.getRequestedTokens());
    }

    /**
     * Fixed: Direct implementation of IP-based key resolver with proper proxy handling
     */
    @Bean("ipKeyResolver")
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String clientIp = getClientIpAddress(exchange);
            return Mono.just("ip:" + clientIp);
        };
    }

    /**
     * User-based key resolver for authenticated requests
     */
    @Bean("userKeyResolver")
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isEmpty()) {
                return Mono.just("user:" + userId);
            }
            // Fallback to IP if no user ID
            String clientIp = getClientIpAddress(exchange);
            return Mono.just("anonymous:" + clientIp);
        };
    }

    /**
     * Compound key resolver for critical paths (user + IP + endpoint)
     */
    @Bean("combinedKeyResolver")
    public KeyResolver combinedKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            String clientIp = getClientIpAddress(exchange);
            String endpoint = getEndpointCategory(exchange.getRequest().getPath().value());

            String key;
            if (userId != null && !userId.isEmpty()) {
                key = String.format("user:%s:ip:%s:endpoint:%s", userId, clientIp, endpoint);
            } else {
                key = String.format("anonymous:ip:%s:endpoint:%s", clientIp, endpoint);
            }

            return Mono.just(key);
        };
    }

    /**
     * Session-based key resolver for stateful operations
     */
    @Bean("sessionKeyResolver")
    public KeyResolver sessionKeyResolver() {
        return exchange -> {
            String sessionId = exchange.getRequest().getHeaders().getFirst("X-Session-Id");
            if (sessionId != null && !sessionId.isEmpty()) {
                return Mono.just("session:" + sessionId);
            }

            // Fallback to user-based resolution
            return userKeyResolver().resolve(exchange);
        };
    }

    /**
     * API key-based resolver for API clients
     */
    @Bean("apiKeyResolver")
    public KeyResolver apiKeyResolver() {
        return exchange -> {
            String apiKey = exchange.getRequest().getHeaders().getFirst("X-API-Key");
            if (apiKey != null && !apiKey.isEmpty()) {
                // Use hash of API key for privacy
                return Mono.just("apikey:" + Math.abs(apiKey.hashCode()));
            }

            // Fallback to user-based resolution
            return userKeyResolver().resolve(exchange);
        };
    }



    /**
     * Fixed: Enhanced client IP address resolution with proper proxy handling and caching
     */
    private String getClientIpAddress(ServerWebExchange exchange) {
        RateLimiterProperties.IpResolution config = rateLimiterProperties.getIpResolution();

        // Try X-Forwarded-For header first (if enabled)
        if (config.isXForwardedForEnabled()) {
            String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                String clientIp = getFirstNonTrustedIp(xForwardedFor, config);
                if (clientIp != null) {
                    return clientIp;
                }
            }
        }

        // Try X-Real-IP header (if enabled)
        if (config.isXRealIpEnabled()) {
            String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !isTrustedProxy(xRealIp, config)) {
                return xRealIp;
            }
        }

        // Fallback to remote address
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }

        return "unknown";
    }

    /**
     * Parse X-Forwarded-For header and return the first non-trusted IP
     */
    private String getFirstNonTrustedIp(String forwardedFor, RateLimiterProperties.IpResolution config) {
        if (forwardedFor == null || forwardedFor.isEmpty()) {
            return null;
        }

        String[] ips = forwardedFor.split(",");
        for (String ip : ips) {
            String trimmedIp = ip.trim();
            if (!trimmedIp.isEmpty() && !isTrustedProxy(trimmedIp, config)) {
                return trimmedIp;
            }
        }
        return null;
    }

    /**
     * Fixed: Check if an IP address is a trusted proxy with caching for performance
     */
    private boolean isTrustedProxy(String ip, RateLimiterProperties.IpResolution config) {
        if (ip == null || ip.isEmpty()) {
            return true;
        }

        // Use cache to avoid repeated CIDR parsing
        return cidrCache.computeIfAbsent(ip, key -> {
            try {
                InetAddress address = InetAddress.getByName(key);
                return config.getTrustedProxies().stream()
                    .anyMatch(cidr -> isIpInRange(address, cidr));
            } catch (Exception e) {
                return true; // Assume trusted on error for safety
            }
        });
    }

    /**
     * Enhanced: Check if an IP address is within a CIDR range (supports IPv4 and IPv6)
     */
    private boolean isIpInRange(InetAddress ip, String cidr) {
        try {
            String[] parts = cidr.split("/");
            InetAddress network = InetAddress.getByName(parts[0]);
            int prefixLength = Integer.parseInt(parts[1]);

            byte[] ipBytes = ip.getAddress();
            byte[] networkBytes = network.getAddress();

            // IPv4 vs IPv6 compatibility check
            if (ipBytes.length != networkBytes.length) {
                return false;
            }

            // Validate prefix length for IPv4 (0-32) and IPv6 (0-128)
            int maxPrefixLength = ipBytes.length == 4 ? 32 : 128;
            if (prefixLength < 0 || prefixLength > maxPrefixLength) {
                return false;
            }

            int bytesToCheck = prefixLength / 8;
            int bitsToCheck = prefixLength % 8;

            // Check full bytes
            for (int i = 0; i < bytesToCheck; i++) {
                if (ipBytes[i] != networkBytes[i]) {
                    return false;
                }
            }

            // Check remaining bits
            if (bitsToCheck > 0 && bytesToCheck < ipBytes.length) {
                int mask = 0xFF << (8 - bitsToCheck);
                return (ipBytes[bytesToCheck] & mask) == (networkBytes[bytesToCheck] & mask);
            }

            return true;
        } catch (Exception e) {
            // Log the error for debugging
            return false;
        }
    }

    /**
     * Categorize endpoint for compound key generation
     */
    private String getEndpointCategory(String path) {
        if (path.startsWith("/api/auth/")) {
            return "auth";
        } else if (path.startsWith("/api/admin/")) {
            return "admin";
        } else if (path.startsWith("/api/users/")) {
            return "users";
        } else if (path.startsWith("/api/")) {
            return "api";
        } else {
            return "other";
        }
    }
}
