/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit manually.
 */


export class UsersGetBatchUserImportStatusResponse {
    /**
    * The stats on the number of users imported successfully
    */
    'imports'?: string = undefined;
    /**
    * Only included for failed imports. The stats on the number of users that failed to be imported
    */
    'errors'?: string = undefined;
    'job'?: JobJobMetadata = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "imports",
            "baseName": "imports",
            "type": "string"
        },
        {
            "name": "errors",
            "baseName": "errors",
            "type": "string"
        },
        {
            "name": "job",
            "baseName": "job",
            "type": "JobJobMetadata"
        }    ];

    static getAttributeTypeMap() {
        return UsersGetBatchUserImportStatusResponse.attributeTypeMap;
    }
}

