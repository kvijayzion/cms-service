package com.mysillydreams.cms.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class RedisConfig {
    // Default settings from Spring Boot will handle Redis cache manager
}
