/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.events.CreateEventsRequest
 * Do not edit manually.
 */

import { Context } from '@model/events/Context';
import { SessionIdRequest } from '@model/events/SessionIdRequest';
import { UserIdRequest } from '@model/events/UserIdRequest';
import { Schema } from '@model/varsapi/Schema';
/**
 * @interface CreateEventsRequest
 */
export interface CreateEventsRequest {
    'user'?: UserIdRequest;
    'session'?: SessionIdRequest;
    'context'?: Context;
    /**
     * The event's name.
     */
    'name': string;
    /**
     * Optional. The event's timestamp, defaults to current time.
     */
    'timestamp'?: string;
    /**
     * Optional. The custom event's payload.
     */
    'properties'?: object;
    'schema'?: Schema;
}

