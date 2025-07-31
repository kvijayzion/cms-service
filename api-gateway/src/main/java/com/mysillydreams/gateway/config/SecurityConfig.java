package com.mysillydreams.gateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mysillydreams.gateway.config.TimeoutProperties;
import com.mysillydreams.gateway.filter.GlobalTimeoutFilter;
import com.mysillydreams.gateway.security.CustomAccessDeniedHandler;
import com.mysillydreams.gateway.security.CustomAuthenticationEntryPoint;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRepository;

/**
 * Enhanced security configuration for API Gateway with custom error handlers
 * and configurable CSRF protection
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${spring.security.csrf.enabled:false}")
    private boolean csrfEnabled;

    @Autowired
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Autowired
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    @Autowired(required = false)  // Only available when CSRF is enabled
    private ServerCsrfTokenRepository csrfTokenRepository;

    /**
     * Main security filter chain with enhanced error handling and configurable CSRF
     */
    @Bean
    @Order(1)
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            // Fixed: Correct CSRF toggle logic
            .csrf(csrf -> {
                if (!csrfEnabled) {
                    csrf.disable();
                } else if (csrfTokenRepository != null) {
                    csrf.csrfTokenRepository(csrfTokenRepository);
                }
            })

            // Fixed: Properly wire custom exception handling
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(customAuthenticationEntryPoint)
                .accessDeniedHandler(customAccessDeniedHandler)
            )

            // Configure authorization rules
            .authorizeExchange(exchanges -> exchanges
                // Allow actuator endpoints
                .pathMatchers("/actuator/**").permitAll()

                // Allow fallback endpoints
                .pathMatchers("/fallback/**").permitAll()

                // Allow auth endpoints (login, admin login, refresh, validate) without authentication
                .pathMatchers("/api/auth/login", "/api/auth/admin/login", "/api/auth/refresh", "/api/auth/validate").permitAll()

                // Allow Eureka-discovered auth routes
                .pathMatchers("/auth/login", "/auth/refresh", "/auth/validate").permitAll()

                // Allow health check endpoints
                .pathMatchers("/api/health/**", "/health/**").permitAll()

                // All other API requests are handled by custom filters (AuthenticationFilter)
                // The gateway validates JWT tokens and adds user info headers for downstream services
                .pathMatchers("/api/**").permitAll()

                // Allow Eureka-discovered routes
                .pathMatchers("/auth/**", "/users/**").permitAll()

                // Deny all other requests
                .anyExchange().denyAll()
            )

            .build();
    }

    /**
     * Global timeout filter registration with proper ordering
     * Fixed: Must run BEFORE security filter chain to map timeouts to 504s, not 401s
     */
    @Bean
    @Order(-100)  // Run before security filters
    public GlobalTimeoutFilter globalTimeoutFilter(ObjectMapper objectMapper, MeterRegistry meterRegistry, TimeoutProperties timeoutProperties) {
        return new GlobalTimeoutFilter(objectMapper, meterRegistry, timeoutProperties);
    }
}
