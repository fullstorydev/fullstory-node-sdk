/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit manually.
 */


export class EventsCreateEventsResponse {
    'user'?: EventsUserResponse = undefined;
    'session'?: EventsSessionResponse = undefined;
    'context'?: EventsContext = undefined;
    'events'?: Array<EventsEvent> = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "user",
            "baseName": "user",
            "type": "EventsUserResponse"
        },
        {
            "name": "session",
            "baseName": "session",
            "type": "EventsSessionResponse"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "EventsContext"
        },
        {
            "name": "events",
            "baseName": "events",
            "type": "Array<EventsEvent>"
        }    ];

    static getAttributeTypeMap() {
        return EventsCreateEventsResponse.attributeTypeMap;
    }
}

