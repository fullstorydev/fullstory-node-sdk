/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from schema: fullstory.v2.users.CreateBatchUserImportJobRequest
 * Do not edit manually.
 */

import { BatchUserImportRequest } from '@model/users/BatchUserImportRequest';

export class CreateBatchUserImportJobRequest {
    /**
    * The list of users and their information that should be imported in this batch request
    */
    'requests'?: Array<BatchUserImportRequest> = undefined;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{ name: string, baseName: string, type: string; }> = [
        {
            'name': 'requests',
            'baseName': 'requests',
            'type': 'Array<BatchUserImportRequest>'
        }
    ];

    static getAttributeTypeMap() {
        return CreateBatchUserImportJobRequest.attributeTypeMap;
    }
}
