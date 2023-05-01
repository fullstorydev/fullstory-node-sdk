# FullStory NodeJS Client SDK

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/fullstorydev/fullstory-node-sdk/tree/main.svg?style=svg&circle-token=ff82bccfd4023cd504f7b59ec5bd537bc875ec79)](https://dl.circleci.com/status-badge/redirect/gh/fullstorydev/fullstory-node-sdk/tree/main)

> This package is in beta preview. It relies on unreleased beta API endpoints that may contain breaking changes without notice, do not use in production.

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

Use the `init` function to initialize the FullStory client with [your API key](https://developer.fullstory.com/server/v2/authentication/).

```ts
import { init } from '@fullstory/server-api-client';

const fsClient = init({ apiKey: '<YOUR_API_KEY>' });
```

#### Users

- Use `users` to access the [users api](https://developer.fullstory.com/server/v2/users/introduction/)

  ```ts
  const { users } = fsClient;
  ```

- [Create a user](https://developer.fullstory.com/server/v2/users/create-user/)

  ```ts
  const createResponse = await users.create({
    uid: 'user123',
    display_name: 'Display Name',
    email: 'user123@example.com',
    properties: {
      pricing_plan: 'paid',
      popup_help: true,
      total_spent: 14.5,
    },
  });
  ```

- [Get a user](https://developer.fullstory.com/server/v2/users/get-user/)

  ```ts
  // get user by the fullstory assigned id
  const getResponse = await users.get('123456');
  ```

- [Get users](https://developer.fullstory.com/server/v2/users/list-users/)

  ```ts
  // get user by the application-specific uid
  const listResponse = await users.list('user123');
  ```

- [Update a user](https://developer.fullstory.com/server/v2/users/update-user/)

  ```ts
  // update user by the fullstory assigned id
  const updatedResponse = await users.update('123456',
    { display_name: 'New Display Name' });
  ```

- [Delete a user](https://developer.fullstory.com/server/v2/users/delete-user/)

  ```ts
  // delete user by the fullstory assigned id
  await users.delete('123456');
  ```

#### Events

- Use `events` to access the [events api](https://developer.fullstory.com/server/v2/events/introduction/)

  ```ts
  const { events } = fsClient;
  ```

- [Create events](https://developer.fullstory.com/server/v2/events/create-events/)

  ```ts
  const createResponse = await events.create({
      user: {
        id: '123456',
      },
      session: {
        use_most_recent: true,
      },
      context: {
        web: {
          url: 'https://www.example.com',
          referrer_url: 'https://www.referrer.com',
        },
        device: {
          ip: '127.0.0.1',
          serial_number: 'ABC',
        },
        location: {
          latitude: 33.80177165865808,
          longitude: -84.39222238465959,
        },
      },
      events: [
        {
          name: 'Support Ticket',
          timestamp: '2022-03-15T14:23:23Z',
          properties: {
            id: 424242,
            priority: 'Normal',
            source: 'Email',
            title: 'Account locked out',
          },
        },
        {
          name: "Another Event",
        }
      ]
    });
  ```

#### Batch Import Job

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
  const job = users.batchCreate(requests);

  // you can add more requests before executing
  job.add([
    { display_name: 'Someone Else' },
    { display_name: 'Last User' },
  ]);
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
      events: [
        {
          name: 'Support Ticket',
          timestamp: '2022-03-15T14:23:23Z',
          properties: {
            source: 'Email',
            title: 'Account locked out',
          },
        },
        {
          name: "Another Event",
        },
        {
          name: "More Events",
        }
      ]
    },
    {
      user: {
        id: '000000',
      },
      session: {
        use_most_recent: true,
      },
      events: [
        {
          name: 'Events - 1',
        },
        {
          name: "Events - 2",
        },
        {
          name: "Events - 3",
        }
      ]
    }
  ];

  // create a job object
  const job = events.batchCreate(requests);

  // you can add more requests before executing
  job.add([
    {
      user: {
        id: '999999',
      },
      events: [
        {
          name: 'Events - 1',
        },
      ]
    }
  ]);
  ```

- Batch Import Options

  Each job can be created with different options:

  ```ts
  const options = {
    // poll job status every one minute
    pollInterval: 60000,
    // retry 5 times on API errors before aborting
    maxRetry: 5,
  }
  ```

- Adding listeners for a batch import job and executing the job

  1. When the job's execute method is called, an API request is made to the server to create the import the job:
  - [users](https://developer.fullstory.com/server/v2/users/create-batch-user-import-job/)
  - [events](https://developer.fullstory.com/server/v2/events/create-batch-events-import-job/)

  2. Once the job is created successfully, `created` listeners are invoked with the job's information.

  3. The job then starts to poll on the server to get the latest job status at an interval:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-import-status/)
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-import-status/)

    Each successful poll will result in `processing` listeners being invoked.

  4. When the job status reaches a `done` state (`COMPLETED` or `FAILED`), we automatically retrieve the results, by calling get batch imports:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-imports/) 
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-imports/) 

    or get batch errors:
  - [users](https://developer.fullstory.com/server/v2/users/get-batch-user-import-errors/) 
  - [events](https://developer.fullstory.com/server/v2/events/get-batch-events-import-errors/)

    And the `done` listeners are invoked with the results.

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

### Multiple batch import jobs

  It is recommended to have one batch import job of a resource type at a given time. However in case you need to create multiple batch import jobs by calling `batchCreate` multiple times. The jobs may be concurrently executed. In this case that the server APIs may return rate limiting errors. It is recommended to adjust the `pollingInterval` option accordingly.

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
