package com.mysillydreams.gateway.exception;

/**
 * Custom exception for invalid error response parameters
 * Provides specific error handling for error response creation failures
 */
public class InvalidErrorResponseException extends RuntimeException {

    public enum ValidationError {
        NULL_ERROR_CODE("Error code cannot be null or empty"),
        NULL_MESSAGE("Error message cannot be null or empty"),
        INVALID_STATUS_CODE("HTTP status code must be between 100 and 599"),
        INVALID_PARAMETER("Invalid parameter provided for error response");

        private final String description;

        ValidationError(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    private final ValidationError validationError;
    private final String parameter;

    public InvalidErrorResponseException(ValidationError validationError) {
        super(validationError.getDescription());
        this.validationError = validationError;
        this.parameter = null;
    }

    public InvalidErrorResponseException(ValidationError validationError, String parameter) {
        super(validationError.getDescription() + (parameter != null ? ": " + parameter : ""));
        this.validationError = validationError;
        this.parameter = parameter;
    }

    public InvalidErrorResponseException(ValidationError validationError, String parameter, Throwable cause) {
        super(validationError.getDescription() + (parameter != null ? ": " + parameter : ""), cause);
        this.validationError = validationError;
        this.parameter = parameter;
    }

    public ValidationError getValidationError() {
        return validationError;
    }

    public String getParameter() {
        return parameter;
    }

    public boolean isErrorCodeInvalid() {
        return validationError == ValidationError.NULL_ERROR_CODE;
    }

    public boolean isMessageInvalid() {
        return validationError == ValidationError.NULL_MESSAGE;
    }

    public boolean isStatusCodeInvalid() {
        return validationError == ValidationError.INVALID_STATUS_CODE;
    }

    /**
     * Get appropriate HTTP status code for this validation error
     * Maps validation errors to appropriate HTTP status codes for consistent error handling
     */
    public int getHttpStatus() {
        switch (validationError) {
            case NULL_ERROR_CODE:
            case NULL_MESSAGE:
            case INVALID_PARAMETER:
                return 400; // Bad Request - client provided invalid parameters
            case INVALID_STATUS_CODE:
                return 500; // Internal Server Error - server configuration issue
            default:
                return 500; // Default to Internal Server Error for unknown validation errors
        }
    }

    /**
     * Enhanced error categories for better classification
     */
    public enum ErrorCategory {
        VALIDATION_ERROR("validation"),
        CONFIGURATION_ERROR("configuration"),
        SYSTEM_ERROR("system"),
        UNEXPECTED_ERROR("unexpected");

        private final String category;

        ErrorCategory(String category) {
            this.category = category;
        }

        public String getCategory() {
            return category;
        }
    }

    /**
     * Get error category for client handling with enhanced classification
     */
    public String getErrorCategory() {
        return getErrorCategoryEnum().getCategory();
    }

    /**
     * Get error category as enum for type-safe handling
     */
    public ErrorCategory getErrorCategoryEnum() {
        switch (validationError) {
            case NULL_ERROR_CODE:
            case NULL_MESSAGE:
            case INVALID_PARAMETER:
                return ErrorCategory.VALIDATION_ERROR;
            case INVALID_STATUS_CODE:
                return ErrorCategory.CONFIGURATION_ERROR;
            default:
                return ErrorCategory.SYSTEM_ERROR;
        }
    }
}
