package com.mysillydreams.gateway.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

/**
 * Configuration properties for rate limiting with refresh support
 * Fixed: Use @ConfigurationProperties instead of multiple @Value annotations
 * Enhanced: Added @RefreshScope for zero-downtime config updates
 * Enhanced: Added @Validated for fail-fast configuration validation
 */
@Component
@Validated
@ConfigurationProperties(prefix = "rate-limiter")
@RefreshScope
public class RateLimiterProperties {

    @Valid
    @NotNull
    private Auth auth = new Auth();

    @Valid
    @NotNull
    private Api api = new Api();

    @Valid
    @NotNull
    private Admin admin = new Admin();

    @Valid
    @NotNull
    private Default defaultLimiter = new Default();

    @Valid
    @NotNull
    private IpResolution ipResolution = new IpResolution();

    /**
     * Authentication rate limiting configuration
     * Units: replenishRate and burstCapacity are requests per second
     */
    public static class Auth {
        @Positive
        private int replenishRate = 5;

        @Positive
        private int burstCapacity = 10;

        @Positive
        private int requestedTokens = 1;

        // Getters and setters
        public int getReplenishRate() { return replenishRate; }
        public void setReplenishRate(int replenishRate) { this.replenishRate = replenishRate; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
        public int getRequestedTokens() { return requestedTokens; }
        public void setRequestedTokens(int requestedTokens) { this.requestedTokens = requestedTokens; }
    }

    /**
     * API rate limiting configuration
     * Units: replenishRate and burstCapacity are requests per second
     */
    public static class Api {
        @Positive
        private int replenishRate = 100;

        @Positive
        private int burstCapacity = 200;

        @Positive
        private int requestedTokens = 1;

        // Getters and setters
        public int getReplenishRate() { return replenishRate; }
        public void setReplenishRate(int replenishRate) { this.replenishRate = replenishRate; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
        public int getRequestedTokens() { return requestedTokens; }
        public void setRequestedTokens(int requestedTokens) { this.requestedTokens = requestedTokens; }
    }

    /**
     * Admin rate limiting configuration
     * Units: replenishRate and burstCapacity are requests per second
     */
    public static class Admin {
        @Positive
        private int replenishRate = 50;

        @Positive
        private int burstCapacity = 100;

        @Positive
        private int requestedTokens = 1;

        // Getters and setters
        public int getReplenishRate() { return replenishRate; }
        public void setReplenishRate(int replenishRate) { this.replenishRate = replenishRate; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
        public int getRequestedTokens() { return requestedTokens; }
        public void setRequestedTokens(int requestedTokens) { this.requestedTokens = requestedTokens; }
    }

    /**
     * Default rate limiting configuration
     * Units: replenishRate and burstCapacity are requests per second
     */
    public static class Default {
        @Positive
        private int replenishRate = 10;

        @Positive
        private int burstCapacity = 20;

        @Positive
        private int requestedTokens = 1;

        // Getters and setters
        public int getReplenishRate() { return replenishRate; }
        public void setReplenishRate(int replenishRate) { this.replenishRate = replenishRate; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
        public int getRequestedTokens() { return requestedTokens; }
        public void setRequestedTokens(int requestedTokens) { this.requestedTokens = requestedTokens; }
    }

    /**
     * IP resolution configuration for trusted proxies
     * CIDR ranges for identifying trusted proxy servers
     */
    public static class IpResolution {
        @NotNull
        private List<String> trustedProxies = List.of(
            // IPv4 private ranges
            "10.0.0.0/8",
            "172.16.0.0/12",
            "192.168.0.0/16",
            "127.0.0.0/8",
            // IPv6 private ranges
            "::1/128",           // IPv6 loopback
            "fc00::/7",          // IPv6 unique local addresses
            "fe80::/10",         // IPv6 link-local addresses
            "::ffff:0:0/96"      // IPv4-mapped IPv6 addresses
        );
        private boolean xForwardedForEnabled = true;
        private boolean xRealIpEnabled = true;

        // Getters and setters
        public List<String> getTrustedProxies() { return trustedProxies; }
        public void setTrustedProxies(List<String> trustedProxies) { this.trustedProxies = trustedProxies; }
        public boolean isXForwardedForEnabled() { return xForwardedForEnabled; }
        public void setXForwardedForEnabled(boolean xForwardedForEnabled) { this.xForwardedForEnabled = xForwardedForEnabled; }
        public boolean isXRealIpEnabled() { return xRealIpEnabled; }
        public void setXRealIpEnabled(boolean xRealIpEnabled) { this.xRealIpEnabled = xRealIpEnabled; }
    }

    // Main getters and setters
    public Auth getAuth() { return auth; }
    public void setAuth(Auth auth) { this.auth = auth; }
    public Api getApi() { return api; }
    public void setApi(Api api) { this.api = api; }
    public Admin getAdmin() { return admin; }
    public void setAdmin(Admin admin) { this.admin = admin; }
    public Default getDefault() { return defaultLimiter; }
    public void setDefault(Default defaultLimiter) { this.defaultLimiter = defaultLimiter; }
    public IpResolution getIpResolution() { return ipResolution; }
    public void setIpResolution(IpResolution ipResolution) { this.ipResolution = ipResolution; }
}
