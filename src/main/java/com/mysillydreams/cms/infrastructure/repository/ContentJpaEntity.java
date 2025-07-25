package com.mysillydreams.cms.infrastructure.repository;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "contents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String category;
    private String videoUrl;
    private Long durationSeconds;
    private Instant uploadedAt;
    private Instant updatedAt;
    private Boolean isPublished;
    private Boolean isTrending;
    private Boolean isDeleted;
}