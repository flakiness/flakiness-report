# Flakiness Report

Official specification for the Flakiness.io report format.

This package provides:

- **TypeScript type definitions** for type-safe usage of Flakiness Report data structures
- **Zod schema validation** for runtime validation of report JSON

The package is compatible with both Node.js and browser environments.

## Source Files

- [TypeScript definitions](./src/flakinessReport.ts) - Complete type definitions for the Flakiness Report format
- [Zod schema](./src/schema.ts) - Runtime validation schemas

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

Build the package:

```bash
npm run build
```

Watch for changes and rebuild automatically:

```bash
npm run watch
```

