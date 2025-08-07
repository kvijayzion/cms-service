package com.mysillydreams.gateway.config;

import com.mysillydreams.gateway.filter.AuthenticationFilter;
import com.mysillydreams.gateway.filter.TracingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Enhanced Gateway routing and configuration with per-route timeouts,
 * retries, dedicated rate limiters, and externalized service URIs
 */
@Configuration
@EnableConfigurationProperties(GatewayProperties.class)
public class GatewayConfig {

    private final GatewayProperties gatewayProperties;

    private final AuthenticationFilter authenticationFilter;
    private final TracingFilter tracingFilter;

    // Fixed: Externalized service URIs from proper configuration paths
    @Value("${gateway.routes.cms-service.uri:lb://cms-service}")
    private String cmsServiceUri;

    @Value("${gateway.routes.auth-service.uri:lb://auth-service}")
    private String authServiceUri;

    @Value("${gateway.routes.user-service.uri:lb://user-service}")
    private String userServiceUri;

    @Value("${gateway.routes.admin-server.uri:lb://admin-server}")
    private String adminServerUri;

    @Value("${gateway.routes.config-service.uri:lb://zookeeper-service}")
    private String configServiceUri;

    @Value("${gateway.routes.default-service.uri:lb://default-backend}")
    private String defaultServiceUri;

    // Timeout configuration - ISO-8601 Duration support
    @Value("${gateway.timeout.per-route-timeout:PT15S}")
    private Duration perRouteTimeout;

    @Value("${gateway.timeout.global-request-timeout:PT30S}")
    private Duration globalRequestTimeout;

    // Fixed: Circuit breaker configuration from proper paths
    @Value("${gateway.routes.cms-service.fallback-uri:forward:/fallback/cms}")
    private String cmsFallbackUri;

    @Value("${gateway.routes.auth-service.fallback-uri:forward:/fallback/auth}")
    private String authFallbackUri;

    @Value("${gateway.routes.user-service.fallback-uri:forward:/fallback/user}")
    private String userFallbackUri;

    @Value("${gateway.routes.admin-server.fallback-uri:forward:/fallback/admin}")
    private String adminFallbackUri;

    @Value("${gateway.routes.config-service.fallback-uri:forward:/fallback/config}")
    private String configFallbackUri;

    @Value("${gateway.routes.default-service.fallback-uri:forward:/fallback/default}")
    private String defaultFallbackUri;

    // Retry configuration
    @Value("${retry.auth-service.max-attempts:3}")
    private int authRetryMaxAttempts;

    @Value("${retry.user-service.max-attempts:3}")
    private int userRetryMaxAttempts;

    @Value("${retry.admin-service.max-attempts:2}")
    private int adminRetryMaxAttempts;

    // Rate limiters
    @Autowired
    @Qualifier("authRedisRateLimiter")
    private RedisRateLimiter authRedisRateLimiter;

    @Autowired
    @Qualifier("apiRedisRateLimiter")
    private RedisRateLimiter apiRedisRateLimiter;

    @Autowired
    @Qualifier("adminRedisRateLimiter")
    private RedisRateLimiter adminRedisRateLimiter;

    // Key resolvers
    @Autowired
    @Qualifier("ipKeyResolver")
    private KeyResolver ipKeyResolver;

    @Autowired
    @Qualifier("userKeyResolver")
    private KeyResolver userKeyResolver;

    @Autowired
    @Qualifier("combinedKeyResolver")
    private KeyResolver combinedKeyResolver;

    @Autowired
    @Qualifier("sessionKeyResolver")
    private KeyResolver sessionKeyResolver;

    @Autowired
    @Qualifier("apiKeyResolver")
    private KeyResolver apiKeyResolver;

    public GatewayConfig(GatewayProperties gatewayProperties, AuthenticationFilter authenticationFilter, TracingFilter tracingFilter) {
        this.gatewayProperties = gatewayProperties;
        this.authenticationFilter = authenticationFilter;
        this.tracingFilter = tracingFilter;
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // CMS Service Routes - content management and streaming
                .route("cms-api", r -> r
                        .path("/api/contents/**", "/api/health/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // Tracing first
                                .requestRateLimiter(config -> config
                                        .setRateLimiter(apiRedisRateLimiter)
                                        .setKeyResolver(ipKeyResolver))  // IP-based for public content
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))
                                .retry(config -> config
                                        .setRetries(3)
                                        .setMethods(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.POST)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(5000), 2, true))
                                .circuitBreaker(config -> config
                                        .setName("cms-api-cb")
                                        .setFallbackUri(cmsFallbackUri)))
                        .uri(cmsServiceUri))

                // CMS Actuator Routes - health checks and metrics
                .route("cms-actuator", r -> r
                        .path("/actuator/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // Only tracing for actuator
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(Duration.ofSeconds(5))))
                        .uri(cmsServiceUri))

                // CMS WebSocket Routes - real-time communication
                .route("cms-websocket", r -> r
                        .path("/ws/**")
                        .uri("ws://localhost:8081"))

                .build();
    }

    // TODO: Add other service routes when they become available
    /*
                // Auth Service Routes - login endpoints with proper rate limiting
                .route("auth-login", r -> r
                        .path("/api/auth/login", "/api/auth/admin/login", "/api/auth/refresh", "/api/auth/validate")
                        .filters(f -> f
                                .filter(tracingFilter)  // Tracing first
                                .requestRateLimiter(config -> config
                                        .setRateLimiter(authRedisRateLimiter)
                                        .setKeyResolver(ipKeyResolver))  // IP-based for login attempts
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))
                                .retry(config -> config
                                        .setRetries(authRetryMaxAttempts)
                                        .setMethods(org.springframework.http.HttpMethod.POST)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(5000), 2, true))
                                .circuitBreaker(config -> config
                                        .setName("auth-login-cb")
                                        .setFallbackUri(authFallbackUri))
                                .stripPrefix(1))  // Strip /api prefix
                        .uri(authServiceUri))

                // Fixed: Auth Service Admin Routes - proper filter ordering
                .route("auth-admin", r -> r
                        .path("/api/auth/admin/**", "/api/auth/password-rotate")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing first
                                .filter(authenticationFilter)  // 2. Authentication
                                .requestRateLimiter(config -> config  // 3. Rate limiting (after auth)
                                        .setRateLimiter(adminRedisRateLimiter)
                                        .setKeyResolver(combinedKeyResolver))  // Combined user+IP+endpoint
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))  // 4. Timeout
                                .retry(config -> config  // 5. Retry
                                        .setRetries(adminRetryMaxAttempts)
                                        .setMethods(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.POST, org.springframework.http.HttpMethod.PUT)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(3000), 2, true))
                                .circuitBreaker(config -> config  // 6. Circuit breaker
                                        .setName("auth-admin-cb")
                                        .setFallbackUri(authFallbackUri))
                                .stripPrefix(1))  // 7. Strip /api prefix
                        .uri(authServiceUri))

                // Fixed: User Service Routes - proper filter ordering
                .route("user-service", r -> r
                        .path("/api/users/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing first
                                .filter(authenticationFilter)  // 2. Authentication
                                .requestRateLimiter(config -> config  // 3. Rate limiting (after auth)
                                        .setRateLimiter(apiRedisRateLimiter)
                                        .setKeyResolver(userKeyResolver))
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))  // 4. Timeout
                                .retry(config -> config  // 5. Retry
                                        .setRetries(userRetryMaxAttempts)
                                        .setMethods(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.POST, org.springframework.http.HttpMethod.PUT)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(5000), 2, true))
                                .circuitBreaker(config -> config  // 6. Circuit breaker
                                        .setName("user-service-cb")
                                        .setFallbackUri(userFallbackUri)))
                        .uri(userServiceUri))

                // Fixed: Admin Server Routes - proper filter ordering
                .route("admin-server", r -> r
                        .path("/api/admin-server/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing first
                                .filter(authenticationFilter)  // 2. Authentication
                                .requestRateLimiter(config -> config  // 3. Rate limiting (after auth)
                                        .setRateLimiter(adminRedisRateLimiter)
                                        .setKeyResolver(sessionKeyResolver))
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))  // 4. Timeout
                                .retry(config -> config  // 5. Retry
                                        .setRetries(adminRetryMaxAttempts)
                                        .setMethods(org.springframework.http.HttpMethod.GET)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(3000), 2, true))
                                .circuitBreaker(config -> config  // 6. Circuit breaker
                                        .setName("admin-server-cb")
                                        .setFallbackUri(adminFallbackUri))
                                .stripPrefix(1))  // 7. Strip prefix
                        .uri(adminServerUri))

                // Fixed: Internal Service Communication - proper filter ordering
                .route("internal-auth", r -> r
                        .path("/api/internal/auth/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing first
                                .filter(authenticationFilter)  // 2. Authentication
                                .requestRateLimiter(config -> config  // 3. Rate limiting (after auth)
                                        .setRateLimiter(apiRedisRateLimiter)
                                        .setKeyResolver(apiKeyResolver))  // API key based resolution
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))  // 4. Timeout
                                .retry(config -> config  // 5. Retry
                                        .setRetries(2)
                                        .setMethods(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.POST)
                                        .setBackoff(Duration.ofMillis(500), Duration.ofMillis(2000), 2, true))
                                .circuitBreaker(config -> config  // 6. Circuit breaker
                                        .setName("internal-auth-cb")
                                        .setFallbackUri(authFallbackUri)))
                        .uri(authServiceUri))

                // Fixed: Zookeeper Configuration Service Routes - proper filter ordering
                .route("zookeeper-service", r -> r
                        .path("/api/config/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing first
                                .filter(authenticationFilter)  // 2. Authentication
                                .requestRateLimiter(config -> config  // 3. Rate limiting (after auth)
                                        .setRateLimiter(adminRedisRateLimiter)
                                        .setKeyResolver(combinedKeyResolver))
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(Duration.ofSeconds(5)))  // 4. Timeout (shorter for config service)
                                .retry(config -> config  // 5. Retry
                                        .setRetries(2)
                                        .setMethods(org.springframework.http.HttpMethod.GET, org.springframework.http.HttpMethod.POST)
                                        .setBackoff(Duration.ofMillis(1000), Duration.ofMillis(3000), 2, true))
                                .circuitBreaker(config -> config  // 6. Circuit breaker
                                        .setName("zookeeper-service-cb")
                                        .setFallbackUri(configFallbackUri)))
                        .uri(configServiceUri))

                // Fixed: Health Check Routes - no rate limiting for actuator endpoints
                .route("health-checks", r -> r
                        .path("/api/health/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // 1. Tracing only (no auth for health checks)
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(Duration.ofSeconds(5)))  // 2. Short timeout for health checks
                                .stripPrefix(1))  // 3. Strip prefix (no rate limiting for health)
                        .uri(authServiceUri))

                // Fixed: Actuator Routes - completely exempt from all filters except tracing
                .route("actuator-endpoints", r -> r
                        .path("/actuator/**")
                        .filters(f -> f
                                .filter(tracingFilter))  // Only tracing, no auth/rate-limit/timeout
                        .uri(authServiceUri))

                // Default fallback route - catch-all with lowest priority
                .route("default-fallback", r -> r
                        .path("/**")
                        .filters(f -> f
                                .filter(tracingFilter)  // Tracing only
                                .filter((exchange, chain) -> chain.filter(exchange).timeout(perRouteTimeout))
                                .circuitBreaker(config -> config
                                        .setName("default-cb")
                                        .setFallbackUri(defaultFallbackUri)))
                        .uri(defaultServiceUri))
                        // Note: order(999) removed - use route ordering in YAML if needed
                */



    /**
     * Default rate limiter for health checks and general endpoints
     */
    @Bean
    public RedisRateLimiter defaultRateLimiter() {
        return new RedisRateLimiter(10, 20, 1);
    }
}
