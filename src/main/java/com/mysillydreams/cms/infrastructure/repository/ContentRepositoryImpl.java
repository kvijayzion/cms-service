package com.mysillydreams.cms.infrastructure.repository;

import com.mysillydreams.cms.domain.model.Content;
import com.mysillydreams.cms.domain.repository.ContentRepository;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class ContentRepositoryImpl implements ContentRepository {

    private final ContentJpaRepository jpaRepository;

    public ContentRepositoryImpl(ContentJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Content> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Content> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Content save(Content content) {
        ContentJpaEntity entity = toEntity(content);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        jpaRepository.deleteById(id);
    }

    private Content toDomain(ContentJpaEntity e) {
        return new Content(e.getId(), e.getTitle(), e.getDescription(), e.getCategory(), e.getVideoUrl(),
                Duration.ofSeconds(e.getDurationSeconds()));
    }

    private ContentJpaEntity toEntity(Content c) {
        ContentJpaEntity e = new ContentJpaEntity();
        e.setId(c.getId());
        e.setTitle(c.getTitle());
        e.setDescription(c.getDescription());
        e.setCategory(c.getCategory());
        e.setVideoUrl(c.getVideoUrl());
        e.setDurationSeconds(c.getDuration().getSeconds());
        e.setUploadedAt(c.getUploadedAt());
        return e;
    }
}
