package com.mysillydreams.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRepository;
import org.springframework.util.AntPathMatcher;

import java.util.List;

/**
 * CSRF configuration for API Gateway with externalized settings.
 * Only active when CSRF is enabled via spring.security.csrf.enabled=true
 */
@Configuration
@ConditionalOnProperty(name = "spring.security.csrf.enabled", havingValue = "true")
public class CsrfConfiguration {

    @Value("${gateway.csrf.cookie-name:XSRF-TOKEN}")
    private String cookieName;

    @Value("${gateway.csrf.header-name:X-XSRF-TOKEN}")
    private String headerName;

    @Value("${gateway.csrf.cookie-path:/}")
    private String cookiePath;

    @Value("${gateway.csrf.cookie-max-age:3600}")
    private int cookieMaxAge;

    @Value("${gateway.csrf.cookie-secure:true}")
    private boolean cookieSecure;

    @Value("${gateway.csrf.cookie-same-site:Lax}")
    private String cookieSameSite;

    // Fixed: Complete paths without truncation
    @Value("#{'${CSRF_PROTECTED_PATHS:/api/auth/admin/**,/api/users/**,/api/admin/**}'.split(',')}")
    private List<String> protectedPaths;

    @Value("#{'${CSRF_EXEMPT_PATHS:/api/auth/login,/api/auth/admin/login,/api/auth/refresh,/api/auth/validate,/actuator/**,/api/health/**,/fallback/**}'.split(',')}")
    private List<String> exemptPaths;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * CSRF token repository using cookies with HTTPS-aware security configuration
     */
    @Bean
    public ServerCsrfTokenRepository csrfTokenRepository() {
        CookieServerCsrfTokenRepository repository = CookieServerCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieName(cookieName);
        repository.setHeaderName(headerName);
        repository.setCookiePath(cookiePath);
        repository.setCookieMaxAge(cookieMaxAge);

        // Fixed: HTTPS-aware secure and sameSite flags
        repository.setCookieCustomizer(cookie -> {
            // Only set secure flag when actually using HTTPS
            boolean isHttpsEnvironment = isHttpsEnvironment();
            cookie.secure(cookieSecure && isHttpsEnvironment);
            cookie.sameSite(cookieSameSite);
        });

        return repository;
    }

    /**
     * Check if we're running in an HTTPS environment
     */
    private boolean isHttpsEnvironment() {
        String profile = System.getProperty("spring.profiles.active", "local");
        // Local development typically uses HTTP
        if ("local".equals(profile)) {
            return false;
        }
        // Check for HTTPS indicators
        String serverSsl = System.getProperty("server.ssl.enabled", "false");
        String httpsHeader = System.getProperty("server.forward-headers-strategy", "none");
        return "true".equals(serverSsl) || !"none".equals(httpsHeader);
    }

    /**
     * CSRF path matcher with configurable protected and exempt paths
     */
    @Bean
    public CsrfPathMatcher csrfPathMatcher() {
        return new CsrfPathMatcher(protectedPaths, exemptPaths, pathMatcher);
    }

    /**
     * CSRF path matcher implementation with enhanced pattern matching
     */
    public static class CsrfPathMatcher {

        private final List<String> protectedPaths;
        private final List<String> exemptPaths;
        private final AntPathMatcher pathMatcher;

        public CsrfPathMatcher(List<String> protectedPaths, List<String> exemptPaths, AntPathMatcher pathMatcher) {
            this.protectedPaths = protectedPaths;
            this.exemptPaths = exemptPaths;
            this.pathMatcher = pathMatcher;
        }

        /**
         * Check if a path should be exempt from CSRF protection
         * Fixed: Properly use AntPathMatcher for wildcard matching
         */
        public boolean isCsrfExempt(String path) {
            // First check exempt paths (takes precedence)
            for (String exemptPath : exemptPaths) {
                if (pathMatcher.match(exemptPath.trim(), path)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Check if a path should be protected by CSRF
         * Fixed: Properly use AntPathMatcher for wildcard matching
         */
        public boolean isCsrfProtected(String path) {
            // Skip if explicitly exempt
            if (isCsrfExempt(path)) {
                return false;
            }

            // Check if path matches protected patterns using AntPathMatcher
            for (String protectedPath : protectedPaths) {
                if (pathMatcher.match(protectedPath.trim(), path)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Get the list of protected paths
         */
        public List<String> getProtectedPaths() {
            return protectedPaths;
        }

        /**
         * Get the list of exempt paths
         */
        public List<String> getExemptPaths() {
            return exemptPaths;
        }
    }
}
