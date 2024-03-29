/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.job.JobMetadata
 * Do not edit manually.
 */

import { JobStatus } from '@model/job/JobStatus';
/**
 * @interface JobMetadata JobMetadata contains metadata about asynchronous jobs.
 */
export interface JobMetadata {
    /**
     * ID of the job.
     */
    'id': string;
    'status': JobStatus;
    /**
     * Time the job was accepted.
     */
    'created': string;
    /**
     * Time the job was finished, either successfully or unsuccessfully.
     */
    'finished'?: string;
}

