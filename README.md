# Flakiness Report

Official specification for the [Flakiness.io](https://flakiness.io) report format.

The Flakiness Report format was inspired by the Playwright Test report format and extends it to support comprehensive test execution analysis across multiple environments.

In a nutshell, *Flakiness Report* is a **JSON file** that follows this
specification. Oftentimes, this JSON file is accompanied by a set of files -
*attachments*. Usually both JSON file and attachments are placed in the same directory.

This package provides:

- [**TypeScript type definitions**](./src/flakinessReport.ts) for type-safe usage of Flakiness Report data structures
- [**Zod schema validation**](./src/schema.ts) for runtime validation of report JSON

The package is compatible with both Node.js and browser environments.

## Features

The Flakiness Report format supports:

- **Test Tags** - Categorize tests using custom tags
- **Test Annotations** - Attach metadata and annotations to test runs
- **Multiple Errors per Test** - Capture all errors including soft errors that don't fail the test
- **System Monitoring** - Track CPU and RAM utilization during test execution with time-series sampling
- **Multiple Execution Environments** - Run the same tests across different configurations (OS, browser, project settings) in a single report

## Source Files

- [TypeScript definitions](./src/flakinessReport.ts) - Complete type definitions for the Flakiness Report format
- [Zod schema](./src/schema.ts) - Runtime validation schemas

> **💡 Tip:** The TypeScript type definitions include extensive inline comments that describe each entity and field in detail. Be sure to read through the comments in `flakinessReport.ts` for a comprehensive understanding of the report format structure.

## Installation

```bash
npm install @flakiness/flakiness-report
```

## Usage

```typescript
import { FlakinessReport } from '@flakiness/flakiness-report';

// Type-safe report handling
const report: FlakinessReport.Report = { /* ... */ };

// Validate report structure
const error = FlakinessReport.validate(report);
if (error) {
  console.error('Validation failed:', error);
}
```

## Attachments

Attachments (screenshots, videos, logs, etc.) are referenced in the report by ID rather than embedded directly. Each attachment in a `RunAttempt` contains:

- `name` - The attachment filename
- `contentType` - MIME type of the attachment
- `id` - Unique identifier used to retrieve the actual attachment content

The report JSON only contains attachment metadata. The actual attachment data must be stored and retrieved separately using the attachment ID.

## Development

For information on building, watching, and contributing to this project, see [CONTRIBUTING.md](./CONTRIBUTING.md).

