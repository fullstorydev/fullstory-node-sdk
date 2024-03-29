/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.events.GetBatchEventsImportErrorsResponse.FailedEventsImport
 * Do not edit manually.
 */

import { CreateEventRequest } from '@model/events/CreateEventRequest';
import { SharedData } from '@model/events/SharedData';
/**
 * @interface FailedEventsImport Server response for failed batch events
 */
export interface FailedEventsImport {
    /**
     * A description of the failure encountered while importing the events.
     */
    'message'?: string;
    /**
     * The error code.
     */
    'code'?: string;
    'event'?: CreateEventRequest;
    'shared'?: SharedData;
}

