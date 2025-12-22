# Flakiness JSON Report Specification

Official specification for the [Flakiness.io](https://flakiness.io) report format.

The Flakiness Report format was inspired by the Playwright Test report format and extends it to support comprehensive test execution analysis across multiple environments.

In a nutshell, *Flakiness Report* is a **JSON file** that follows this
specification. Oftentimes, this JSON file is accompanied by a set of files -
*attachments*. This format defines a standardized file system layout for storing these test artifacts.

This repository contains:

- [**TypeScript type definitions**](./src/flakinessReport.ts) for type-safe usage of Flakiness Report data structures
- [**Zod schema validation**](./src/schema.ts) for runtime validation of report JSON
- Directory layout to store report and its attachments on file system

## Features

The Flakiness Report format supports:

- **Test Tags** - Categorize tests using custom tags
- **Test Annotations** - Attach metadata and annotations to test runs
- **Multiple Errors per Test** - Capture all errors including soft errors that don't fail the test
- **System Monitoring** - Track CPU and RAM utilization during test execution with time-series sampling
- **Multiple Execution Environments** - Run the same tests across different configurations (OS, browser, project settings) in a single report

## Usage

Once you have a `flakiness-report` on the file system, you can view & upload it
using the [Flakiness CLI Tool](https://flakiness.io/docs/cli/):

```sh
# view report
flakiness show ./flakiness-report
# upload report to flakiness.io
flakiness upload ./flakiness-report
```

Learn more in the [official documentation](https://flakiness.io/docs/cli/).

## Specification

### JSON format

- [JSON format explainer](./src/flakinessReport.ts) - JSON format explainer in a form
  of a TypeScript type
- [Zod schema](./src/schema.ts) - JSON format validator as a Zod schema

> **💡 Tip:** The TypeScript type definitions include extensive inline comments that describe each entity and field in detail. Be sure to read through the comments in `flakinessReport.ts` for a comprehensive understanding of the report format structure.

## Minimal Example

Here's a minimal Flakiness Report with one environment, one test and one attachment:

```
flakiness-report/
├── report.json
└── attachments/
    └── 5d41402abc4b2a76b9719d911017c592
```

```json
{
  "category": "pytest",
  "commitId": "a1b2c3d4e5f6789012345678901234567890abcd",
  "environments": [
    {
      "name": "Python Tests"
    }
  ],
  "tests": [
    {
      "title": "should pass basic test",
      "location": {
        "file": "tests/test_example.py",
        "line": 3,
        "column": 1
      },
      "attempts": [
        {
          "environmentIdx": 0,
          "expectedStatus": "passed",
          "status": "passed",
          "startTimestamp": 1703001600000,
          "duration": 1500,
          "attachments": [
            {
              "name": "screenshot.png",
              "contentType": "image/png",
              "id": "5d41402abc4b2a76b9719d911017c592"
            }
          ]
        }
      ]
    }
  ],
  "startTimestamp": 1703001600000,
  "duration": 2000
}
```

## Report Concepts

1. **File Paths**
    All file paths within the report are POSIX-formatted paths relative to the repository root, regardless of the platform on which tests are executed.
1. **Test**
    A test represents a specific location in the source code.
2. **Suite**
    A suite is a logical grouping of tests. Suites can be of various types and may have associated file locations.
3. **Environment**
    An environment is a set of key-value pairs that describe the execution context. Environments capture information about the operating system, browser, and other testing properties.
4. **Run Attempts**
    A run attempt represents a single execution of a test within a specific environment. When test runners automatically retry failed tests, each retry is recorded as a separate run attempt for the same test in the same environment.
5. **Test Statuses**
    Each run attempt has both an actual status and an expected status. The expected status is typically `passed`, but some test runners allow marking tests as expected to fail, in which case the expected status is `failed`.

    The Flakiness Report viewer supports filtering reports by status.
6. **Test Tags**
    Test tags are case-insensitive markers assigned to tests. Tags are static and cannot be dynamically attached during test execution; they are typically modified only when source code changes. Common examples include `smoke`, `e2e`, and `regression`.

    The Flakiness Report viewer supports filtering reports by tags.
7. **Annotations**
    Annotations are metadata attached to individual run attempts, unlike tags which are attached to tests themselves. Annotations are dynamic and can vary across different test executions.
    
    Each annotation has a type and a description. Common use cases include:
    - `skip` annotations to mark tests as skipped (without additional description)
    - `owner` annotations to assign ownership of specific tests

    The Flakiness Report viewer supports filtering by annotations.
8. **Attachments**
    Each run attempt might also have an attachment: a screenshots, video, log, or
    any other piece of debugging information that is referenced by ID. Actual attachment contents are stored on the file system, following the directory layout explained in the "Attachments" section.

### Attachments

Attachments (screenshots, videos, logs, etc.) are referenced in the report by ID rather than embedded directly.

Each attachment in a `RunAttempt` contains:

- `name` - The attachment filename
- `contentType` - MIME type of the attachment
- `id` - Unique identifier used to retrieve the actual attachment content. It is recommended to use the MD5 hash of the attachment content as the identifier.

The actual attachment files are stored in the `attachments/` directory alongside the `report.json`, with their `id` as the filename (without extension).

The report JSON and its attachments should be organized as follows:

```
flakiness-report/
├── report.json
└── attachments/
    ├── 5d41402abc4b2a76b9719d911017c592
    ├── 7d865e959b2466918c9863afca942d0f
    └── 9bb58f26192e4ba00f01e2e7b136bbd8
```

**Important:** Report generators shall not compress attachments manually. The Flakiness.io CLI tool automatically applies optimal compression for different file types during upload.

## NPM Package

The repository is published to NPM and is compatible with both Node.js and browser environments:

```bash
# Install this type definition
npm install @flakiness/flakiness-report
```

The package provides a simple validation utility for the reports.

```typescript
import { FlakinessReport } from '@flakiness/flakiness-report';

// Type-safe report handling
const report: FlakinessReport.Report = { /* ... */ };

const validation = FlakinessSchema.validate(report);
if (!validation.success)
  console.error(`Validation failed:`, z.prettifyError(validation.error));
```

## Development

For information on building, watching, and contributing to this project, see [CONTRIBUTING.md](./CONTRIBUTING.md).

