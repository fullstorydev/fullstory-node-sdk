/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit manually.
 */


export class UsersCreateBatchUserImportJobRequest {
    /**
    * The list of users and their information that should be imported in this batch request
    */
    'requests'?: Array<UsersBatchUserImportRequest> = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "requests",
            "baseName": "requests",
            "type": "Array<UsersBatchUserImportRequest>"
        }    ];

    static getAttributeTypeMap() {
        return UsersCreateBatchUserImportJobRequest.attributeTypeMap;
    }
}

