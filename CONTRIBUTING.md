# Welcome to FullStory NodeJS SDK contributing guide

Thank you for taking the time to contribute to the FullStory NodeJS SDK project! We appreciate and welcome our community members to raise questions, open issues, or create PRs.

## Getting started

To get started with FullStory Server API, see [the developer guide](https://developer.fullstory.com/server/v2/getting-started/).

See project [README](https://github.com/fullstorydev/fullstory-node-sdk/blob/main/README.md) to get started with the NodeJS SDK.

## Create a new issue

If you notice any issues or anything that may be confusing to you, search to see if there's an [issue](https://github.com/fullstorydev/fullstory-node-sdk/issues) already created.

If an issue doesn't already exist, you can open a new issue using a relevant [issue form](https://github.com/fullstorydev/fullstory-node-sdk/issues/new/choose).

## Create a PR

Follow the following steps if you notice any issues that interest you and would like to create a PR to fix them.

- Fork the repository.

- Set up the project locally following the instructions in [README](https://github.com/fullstorydev/fullstory-node-sdk/blob/main/README.md).

- Create and commit your changes to your feature branch. See testing section for running tests locally.

- Once you are happy with your changes, [open a PR from your fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).

- Describe your changes and make sure to link to the issue being addressed.

Some tips for successful PR:

- Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) so a member of the FullStory team can work on the PR.

- A FullStory team member may ask for changes to be made before a PR can be merged. Address them by making changes and committing to your branch.

- Resolve any conversations in the PR, as they are addressed.

## Development

### Code Generator

This project uses [OpenAPI Generator](https://openapi-generator.tech/) to generate [models](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/src/model) and [APIs](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/src/api) from the [OpenAPI specs](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/specs).

Do not edit the generated files directly. In stead, make your changes to the [openapi-generator](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/openapi-generator) to apply to updates to all models and apis generated.

### Testing

Tests must be run successfully before each PR can be merged. Follow the following steps to run local test.

#### Tests for the OpenAPI Generator

Run the following command to run all unit tests for [openapi-generator](https://github.com/fullstorydev/fullstory-node-sdk/tree/main/openapi-generator).

The tests will also generate files in the `openapi-generator/out` folder so you can inspect the output without overriding the `src` files.

```shell
# from project root
mvn -f openapi-generator clean test  
```

#### TypeScript Unit Tests

Use the following command to run all unit tests within `src`.

```shell
npm run test
```

#### Smoke tests

Smoke tests will invoke server APIs in real environment. By default smoke tests will not run and they do not run in CI on PR creation.

However you may find them helpful to ensure end-to-end functionality. Create a `.env` file at project's root, see [`.example.env`](https://github.com/fullstorydev/fullstory-node-sdk/blob/main/.example.env) to enable the tests.

Use the following command to run the tests.

```shell
npm run test -i src/__tests__/*.smoke.test.ts
```

### Building

#### Generate Code

Run the following command to generate models and apis:

```shell
make gen-openapi
```

#### Build the Project

Run the following command to build the npm package:

```shell
npm run build
# or
npm run build:production
```
