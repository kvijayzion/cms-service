package com.mysillydreams.cms.presentation.controller;

import com.mysillydreams.cms.application.usecase.UploadContentUseCase;
import com.mysillydreams.cms.domain.model.Content;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/content")
public class ContentController {

    private final UploadContentUseCase uploadContentUseCase;

    public ContentController(UploadContentUseCase uploadContentUseCase) {
        this.uploadContentUseCase = uploadContentUseCase;
    }

    @PostMapping
    public ResponseEntity<Content> upload(@RequestBody UploadRequest request) {
        Content content = uploadContentUseCase.upload(
                request.title(), request.description(), request.category(),
                request.videoUrl(), request.durationSeconds());
        return ResponseEntity.ok(content);
    }
}