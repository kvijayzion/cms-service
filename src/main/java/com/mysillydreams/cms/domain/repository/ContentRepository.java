package com.mysillydreams.cms.domain.repository;

import com.mysillydreams.cms.domain.model.Content;

import java.util.List;
import java.util.Optional;

public interface ContentRepository {
    Optional<Content> findById(Long id);
    List<Content> findAll();
    Content save(Content content);
    void delete(Long id);
}