/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit manually.
 */


export class EventsLocationContext {
    'country_code'?: string = undefined;
    'region_code'?: string = undefined;
    'city_name'?: string = undefined;
    'latitude'?: number = undefined;
    'longitude'?: number = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "country_code",
            "baseName": "country_code",
            "type": "string"
        },
        {
            "name": "region_code",
            "baseName": "region_code",
            "type": "string"
        },
        {
            "name": "city_name",
            "baseName": "city_name",
            "type": "string"
        },
        {
            "name": "latitude",
            "baseName": "latitude",
            "type": "number"
        },
        {
            "name": "longitude",
            "baseName": "longitude",
            "type": "number"
        }    ];

    static getAttributeTypeMap() {
        return EventsLocationContext.attributeTypeMap;
    }
}

