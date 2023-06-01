/* eslint multiline-comment-style: ["error", "starred-block"] */
/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.events.SharedData
 * Do not edit manually.
 */

import { Context } from '@model/events/Context';
/**
 * @interface SharedData Optional. Any shared context among all requests in the create batch events import job. If any of the events in the `requests` field also contain a context, the event will fail to be imported.
 */
export interface SharedData {
    'context'?: Context;
}

