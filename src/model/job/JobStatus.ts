/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.job.JobStatus
 * Do not edit manually.
 */

/**
 * @enum JobStatus
 *- PROCESSING: Indicates that the job has been accepted by FullStory and is being processed.
 *- COMPLETED: Indicates that the job has been completed successfully without any errors.
 *- FAILED: Indicates that the job has failures, including partial failures.
 */
export enum JobStatus {
    Processing = 'PROCESSING',
    Completed = 'COMPLETED',
    Failed = 'FAILED'
}
