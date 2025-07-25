package com.mysillydreams.cms.application.usecase;

import com.mysillydreams.cms.domain.model.Content;
import com.mysillydreams.cms.domain.repository.ContentRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class UploadContentUseCase {
    private final ContentRepository contentRepository;

    public UploadContentUseCase(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    public Content upload(String title, String description, String category, String videoUrl, long durationSeconds) {
        Content content = new Content(null, title, description, category, videoUrl, Duration.ofSeconds(durationSeconds));
        return contentRepository.save(content);
    }
}
