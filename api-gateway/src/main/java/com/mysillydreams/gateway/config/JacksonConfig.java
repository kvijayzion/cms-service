package com.mysillydreams.gateway.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.TimeZone;

/**
 * Jackson configuration to ensure consistent timestamp formatting
 * Configures ObjectMapper to write timestamps in ISO-8601 format with UTC offset
 */
@Configuration
public class JacksonConfig {

    private static final Logger logger = LoggerFactory.getLogger(JacksonConfig.class);

    @Value("${app.timezone:UTC}")
    private String appTimeZone;

    /**
     * Configure ObjectMapper for consistent timestamp handling and robust error handling
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register JavaTimeModule for Java 8 time support
        mapper.registerModule(new JavaTimeModule());

        // Serialization configuration
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(SerializationFeature.WRITE_DATES_WITH_ZONE_ID, true); // Include zone info
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false); // Handle incomplete data gracefully

        // Deserialization configuration for robustness
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false); // Graceful handling of unexpected fields
        mapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false); // Handle null values gracefully
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true); // Convert empty strings to null

        // Set configurable timezone for consistent timestamp formatting
        TimeZone configuredTimeZone = getConfiguredTimeZone();
        mapper.setTimeZone(configuredTimeZone);

        logger.info("ObjectMapper configured with timezone: {} and robust error handling", configuredTimeZone.getID());
        return mapper;
    }

    /**
     * Get configured timezone with fallback to UTC for safety
     * Supports both timezone IDs (e.g., "America/New_York") and offsets (e.g., "UTC", "+05:30")
     */
    private TimeZone getConfiguredTimeZone() {
        try {
            // Try to parse as ZoneId first (supports both IDs and offsets)
            ZoneId zoneId = ZoneId.of(appTimeZone);
            TimeZone timeZone = TimeZone.getTimeZone(zoneId);

            logger.debug("Successfully configured timezone: {} ({})", appTimeZone, timeZone.getDisplayName());
            return timeZone;
        } catch (Exception e) {
            logger.warn("Invalid timezone configuration '{}', falling back to UTC. Error: {}",
                       appTimeZone, e.getMessage());
            return TimeZone.getTimeZone(ZoneOffset.UTC);
        }
    }
}
