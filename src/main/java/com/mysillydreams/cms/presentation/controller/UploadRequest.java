package com.mysillydreams.cms.presentation.controller;

public record UploadRequest(
        String title,
        String description,
        String category,
        String videoUrl,
        long durationSeconds
) {}
