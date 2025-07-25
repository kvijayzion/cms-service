package com.mysillydreams.cms.domain.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.Duration;
import java.time.Instant;

@Getter
@Setter
public class Content {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String videoUrl;
    private Duration duration;
    private Instant uploadedAt;
    private Instant updatedAt;
    private Boolean isPublished;
    private Boolean isTrending;
    private Boolean isDeleted;

    public Content(Long id, String title, String description, String category, String videoUrl, Duration duration) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.videoUrl = videoUrl;
        this.duration = duration;
        this.uploadedAt = Instant.now();
        this.updatedAt = Instant.now();
        this.isDeleted = false;
        this.isPublished = false;
        this.isTrending = false;
    }
}
