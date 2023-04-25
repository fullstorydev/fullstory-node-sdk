/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.events.Event
 * Do not edit manually.
 */

import { Schema } from '@model/varsapi/Schema';
/**
 * @interface Event The event payload
 */
export interface Event {
    /**
     * The event name
     */
    'name'?: string;
    /**
     * Optional event timestamp, defaults to current time
     */
    'timestamp'?: string;
    /**
     * The custom event payload
     */
    'properties'?: object;
    'schema'?: Schema;
}

