# FullStory NodeJS Client SDK

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/fullstorydev/fullstory-node-sdk/tree/main.svg?style=svg&circle-token=ff82bccfd4023cd504f7b59ec5bd537bc875ec79)](https://dl.circleci.com/status-badge/redirect/gh/fullstorydev/fullstory-node-sdk/tree/main)

The Official FullStory server API client SDK for NodeJS. The SDK is designed for easy usage to make server-to-server HTTP API requests. For more information visit our [developer site](https://developer.fullstory.com/server/v2/getting-started/).

To use our in-browser module, we also provide a [FullStory browser SDK](https://www.npmjs.com/package/@fullstory/browser).

## NodeJS Support

- Node.js >= 14

## Getting Started

### Installation

```bash
# npm
npm install @fullstory/server-api-client
# yarn
yarn add @fullstory/server-api-client
```

### Usage

#### Initializing the Client

Use the `init` function to initialize the FullStory client with [your API key](https://developer.fullstory.com/server/v2/authentication/). The `FullStoryOptions` used in `init` function will be used for all server API requests, unless overridden by [per request options](#request-options).

```ts
import { init } from '@fullstory/server-api-client';

const fsOpts: FullStoryOptions = {
  // apiKey is required to init the FullStory client
  apiKey: '<YOUR_API_KEY>',
  
  // integrationSource is generally intended for FullStory developers
  // or FullStory partners while building integrations.
  //Generally it should be left empty.
  integrationSource: 'INTEGRATION_NAME' 
};

const fsClient = init(fsOpts);
```

#### Users

- Use `users` to access the [users api](https://developer.fullstory.com/server/v2/users/introduction/)

  ```ts
  const { users } = fsClient;
  ```

- [Create a user](https://developer.fullstory.com/server/v2/users/create-user/)

  ```ts
  const createResponse = await users.create({
    body: {
      uid: 'user123',
      display_name: 'Display Name',
      email: 'user123@example.com',
      properties: {
        pricing_plan: 'paid',
        popup_help: true,
        total_spent: 14.55,
        },
      },
    // optionally provide an idempotencyKey to make
    // the request idempotent
    idempotencyKey: "YOUR_KEY"
    });
  ```

- [Get a user](https://developer.fullstory.com/server/v2/users/get-user/)

  ```ts
  // get user by the FullStory assigned id 
  const getResponse = await users.get({
    id: '123456',
    includeSchema: true
  });
  ```

- [Get users](https://developer.fullstory.com/server/v2/users/list-users/)

  ```ts
  // get all users by the application-specified uid
  const listResponse = await users.list({ uid: 'user123' });
  ```

- [Update a user](https://developer.fullstory.com/server/v2/users/update-user/)

  ```ts
  // update user by the fullstory assigned id
  const updatedResponse = await users.update({
    id: '123456',
    body: { display_name: 'New Display Name' }
  });
  ```

- [Delete a user](https://developer.fullstory.com/server/v2/users/delete-user/)

  ```ts
  // delete user by the FullStory assigned id
  await users.delete({ id: '123456' });

  // delete user by the application-specified uid
  await users.delete({ uid: 'xyz123' });
  ```

#### Events

- Use `events` to access the [events api](https://developer.fullstory.com/server/v2/events/introduction/)

  ```ts
  const { events } = fsClient;
  ```

- [Create a event](https://developer.fullstory.com/server/v2/events/create-events/)

  ```ts
  const createResponse = await events.create({
    body: {
      session: {
        id: '123:456',
      },
      context: {
        browser: {
          url: 'https://www.example.com',
          initial_referrer: 'https://www.referrer.com',
        },
        location: {
          latitude: 33.748997,
          longitude: -84.387985,
        },
      },
      name: 'Support Ticket',
      timestamp: '2022-03-15T14:23:23Z',
      properties: {
        id: 424242,
        priority: 'Normal',
        source: 'Email',
        title: 'Account locked out',
      }
    }
  });
  ```

#### Batch Import Job

- Creating import job objects allows clients to batch import items such as users or events. First create a job object:

  - [Create a batch users import job](https://developer.fullstory.com/server/v2/users/create-batch-user-import-job/)

  ```ts
  // array of users to be imported
  const requests = [
    {
      uid: 'user123',
      display_name: 'Display Name',
      email: 'user123@example.com',
      properties: {
        pricing_plan: 'paid',
        popup_help: true,
        total_spent: 14.5,
      },
    },
    {
      uid: 'user456',
    },
    {
      uid: 'user789',
      display_name: 'A New User',
    },
  ];

  // create a job object
  const job = users.batchCreate({
    body: { requests },
    // include schema in the server response
    // when retrieving imported users
    includeSchema: true,
  });

  // you can add more requests before executing
  job.add(
    { display_name: 'Someone Else' },
    { display_name: 'Last User' },
  );
  ```

- [Create a batch events import job](https://developer.fullstory.com/server/v2/events/create-batch-events-import-job/)

  ```ts
  // array of events requests to be imported
  const requests = [
    {
      user: {
        id: '123456',
      },
      session: {
        use_most_recent: true,
      },
      context: {
        web: {
          url: 'https://www.example.com',
        },
      },
      name: 'Support Ticket',
      timestamp: '2022-03-15T14:23:23Z',
      properties: {
        source: 'Email',
        title: 'Account locked out',
      },
    },
  ];

  // create a job object
  const job = events.batchCreate({ 
    body: { requests }
    includeSchema: true,
  });

  // you can add more requests before executing
  job.add({
      user: {
        id: '999999',
      },
      name: 'Events - 1',
      timestamp: '2022-03-15T14:23:23Z',
    },{
      user: {
        id: '100000',
      },
      name: 'Events - 2',
      timestamp: '2022-03-15T14:23:23Z',
    });
  ```

- Batch import job lifecycle.
  
  Optional events listeners can be added for the batch import job. The batch import job will manage the following lifecycle:

  1. When the job's `execute` method is called, an API request is made to the server to create the import the job:
  - [users](https://developer.fullstory.com/server/v2/users/create-batch-user-import-job/)
  - [events](https://developer.fullstory.com/server/v2/events/create-batch-events-import-job/)

  2. Once the job is created successfully, `created` listeners are invoked with the job's metadata.

  3. The job then starts to poll on the server API to get the latest job status at an interval:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-import-status/)
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-import-status/)

    Each successful poll will invoke the `processing` listeners.

  4. When the job status reaches a `done` state (either `COMPLETED` or `FAILED`), the job automatically starts to retrieve the imported items, by calling the "get batch imports" APIs:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-imports/) 
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-imports/) 

    or "get batch errors" APIs if there were errors:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-import-errors/) 
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-import-errors/)

    And lastly the `done` listeners are invoked with the results.

  5. The `error` listeners are called anytime an error is encountered, may be called more than once.

  6. The `abort` listeners is called only once per job, if non-recoverable errors had occurred, such as multiple API failures had been encountered that exceeds the max number of retries.

    ```ts
    job
      // register listeners before executing
      .on('created', job => {
        console.log('batch job successfully created', job.getId());
      })
      .on('processing', job => {
        console.log('get notified when job status polled and is still processing', job.getId());
      })
      .on('error', error => {
        console.log('an error had occurred during the import', error);
      })
      .on('abort', error => {
        console.error('an unrecoverable error had occurred and the job had been aborted', error);
      })
      .on('done', (imported, failed) => {
        console.log('the batch imported job is done');
        console.log('items successfully imported', imported);
        console.log('items failed to be imported', failed);
      })

      // execute the job by calling the server API
      job.execute();
    ```

    > Note: Any `error`, `abort` or `done` listeners registered after the job has been executed, the callback may be called immediately with any historical data from the job, if any error had occurred, or if the job is already aborted or done, respectively.

- Restart a job
  
  If a job had been successfully created, but aborted for some reason, you may restart the polling of the same job by calling `restart`.

  ```ts
  // restart failed job
  const job = events.batchCreate({
    body: { requests }
  });
  job.on('abort', () => {
    // logic to determine if should restart
    job.restart();
  });
  
  // Or
  // restart a failed job with a job id
  const job = events.batchCreate().restart('your-job-id');
  ```

#### Request Options

If there is a need to override the options from the initially provided options during `init`, the `withOptions` method can be used to apply per-request options to your request.

Using `withOptions` will **not** modify the options initially provided, but returns a new instance.

```ts
  const { events } = init({ apiKey: '<YOUR_API_KEY>' });

  const options: FSRequestOptions = { 
    integrationSource: 'SPECIAL_INTEGRATION_SOURCE' 
  };

  // to apply the options to the create event API
  events.withOptions(options).create(...);
  // to apply the options to the batch create events API
  events.withOptions(options).batchCreate(...);

  // the original options will not be modified
  // below request will not use the SPECIAL_INTEGRATION_SOURCE
  events.create(...);

```

#### Batch Job Options
- Batch Import Options

  Each job can be created with different options. Additional request options can also be provided when creating the job, the request options will be applied to all server API requests such as requests to check for job status.

  ```ts
  const options: BatchJobOptions = {
    // poll job status every one minute
    pollInterval: 60000,
    // retry 5 times on API errors before aborting
    maxRetry: 5,
  }
  
  const createResponse = await users.batchCreate(
      { 
        body: { requests: [{ uid: 'user123' }] },
        includeSchema: true,
      },
      options
  );
  ```

### Multiple batch import jobs

  It is recommended to have one batch import job of a resource type at a given time. However in case you need to create multiple batch import jobs by calling `batchCreate` multiple times. The jobs may be concurrently executed. In this case that the server APIs may return rate limiting errors. It is recommended to adjust the `pollInterval` option accordingly.

  The batch import job execution will retry if rate limit or other transient errors are encountered up to a max number of retries.

## Error Handling

- `init` may throw an error when the required options fields are not satisfied.

- Functions in the FullStory client may throw `FSError` objects. For import jobs, the `FSError` object is provided to the on `error` callbacks.

-  If needed, the `name` field identifies the type of error. The SDK also provides `isFSError` function to check if an error object is a typed `FSError`.

  See [errors](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/src/errors) for more information.

  ```ts
  try {
    ...
  } catch (err: unknown) {
    if (isFSError(err)) {
      switch (err.name) {
         case FSErrorName.ERROR_INVALID_ARGUMENT:
          console.log('An argument provided to the SDK is invalid.');
          break;
        case FSErrorName.ERROR_RATE_LIMITED:
          console.log('FullStory server API returned HTTP 429 Too Many Requests.');
          console.log(`received 'retry - after' header, retry in ${err.getRetryAfter()} milliseconds.`);
          break;
        case FSErrorName.ERROR_PARSE_RESPONSE:
          console.log('Unable to parse FullStory server API responses.');
          console.log(`Raw response received ${(err as FSParserError).fsErrorPayload}.`);
          break;
        case FSErrorName.ERROR_FULLSTORY:
          // API errors except 429s
          console.log('FullStory server API returned non-2xx responses.');
          console.log(`Status: ${(err as FSApiError).httpStatusCode}.`);
          console.log(`Response: ${(err as FSApiError).fsErrorPayload}.`);
          break;
        case FSErrorName.ERROR_TIMEOUT:
          console.log('Timeout exceeded while making FullStory server API requests.');
          break;
        case FSErrorName.ERROR_MAX_RETRY:
          console.log('Max number of retries exceeded during batch import job execution.');
          break;
        case FSErrorName.ERROR_UNKNOWN:
          console.log('Unexpected error occurred.');
          break;
      }
    }
  }
  ```
