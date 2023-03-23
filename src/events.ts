import { CreateEventsRequest, CreateEventsResponse } from '@model/index';

import { EventsApi as FSEventsApi } from './api';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

export interface IEventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvents>): Promise<FSResponse<CreateEventsResponse>>;
}

export class Events implements IEventsApi {
    protected readonly eventsImpl: FSEventsApi;

    constructor(opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    async create(body: CreateEventsRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateEventsResponse>> {
        return this.eventsImpl.createEvents(body, options);
    }
}

// TODO(sabrina): add batch operations