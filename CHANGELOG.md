# Changelog

## 1.0.0-beta.6

- [#46](https://github.com/fullstorydev/fullstory-node-sdk/pull/46) improvements to the smoke tests
- [#47](https://github.com/fullstorydev/fullstory-node-sdk/pull/47) add function to allow `restart` a created job.
- [#48](https://github.com/fullstorydev/fullstory-node-sdk/pull/48) update batch job to no longer send extra fields to the APIs
- [#49](https://github.com/fullstorydev/fullstory-node-sdk/pull/49) update all APIs to use `/v2` endpoints

## 1.0.0-beta.5

- [#44](https://github.com/fullstorydev/fullstory-node-sdk/pull/44)
  - Fix query parameter to use `page_token` instead of `next_page-token`.
  - Allow batch jobs for users and events to request for `include_schema`.
  - Move `Integration-Source` from request/query parameters into request headers.
  - Add `Idempotency-Key` into request headers.

## 1.0.0-beta.4

- [#38](https://github.com/fullstorydev/fullstory-node-sdk/pull/38)
  - Developer enhancements: allowing APIs to point to a different environment for development and testing.

- [#39](https://github.com/fullstorydev/fullstory-node-sdk/pull/39)
  - Pass `integration_src` to server APIs

- [#40](https://github.com/fullstorydev/fullstory-node-sdk/pull/40)
  - Update server API interface: create user, update user, and create event APIs will return response bodies with `id`s only.

## 1.0.0-beta.3

- [#36](https://github.com/fullstorydev/fullstory-node-sdk/pull/36)
  - Create events API to take a single event per request.
  - Batch create events to take an array of single event request, with optional shared context.

## 1.0.0-beta.2

- [#34](https://github.com/fullstorydev/fullstory-node-sdk/pull/34) - Add additional exported types.

## 1.0.0-beta.1

- Initial release for [v2beta server API endpoints](https://developer.fullstory.com/server/v2/getting-started/).
