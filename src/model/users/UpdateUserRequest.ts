/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.users.UpdateUserRequest
 * Do not edit manually.
 */


export class UpdateUserRequest {
    /**
    * The application-specific ID you\'ve given to the user
    */
    'uid'?: string = undefined;
    /**
    * The nice-looking name for this user
    */
    'display_name'?: string = undefined;
    /**
    * The email address associated with this user
    */
    'email'?: string = undefined;
    /**
    * Properties that provide additional information about your user. * Up to 500 unique properties are allowed. * Property names must be a sequence of alphanumeric characters A-Z, a-z, or 0-9 and underscores (\"_\"). * Property names must start with an alphabetic character (A-Z or a-z). * The maximum property name length is 512 characters. * Property values may also contain nested objects. Properties within nested objects must still conform to the naming requirements. For nested objects, the property name including the dotted concatenation of all its parent properties must still be under the length limit of 512 characters. * Property values have a maximum size of 8192 bytes. If the value for the property is larger than this limit, the property will be rejected.
    */
    'properties'?: object = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{ name: string, baseName: string, type: string; }> = [
        {
            'name': 'uid',
            'baseName': 'uid',
            'type': 'string'
        },
        {
            'name': 'display_name',
            'baseName': 'display_name',
            'type': 'string'
        },
        {
            'name': 'email',
            'baseName': 'email',
            'type': 'string'
        },
        {
            'name': 'properties',
            'baseName': 'properties',
            'type': 'object'
        }
    ];

    static getAttributeTypeMap() {
        return UpdateUserRequest.attributeTypeMap;
    }
}

