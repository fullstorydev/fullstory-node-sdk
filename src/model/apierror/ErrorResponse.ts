/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.apierror.ErrorResponse
 * Do not edit manually.
 */

/**
 * @interface ErrorResponse A structured error response from the server
 */
export interface ErrorResponse {
    /**
     * Long form description of what went wrong
     */
    'message': string;
    /**
     * A short snake-cased value that is safe to handle programmatically
     */
    'code': string;
}

