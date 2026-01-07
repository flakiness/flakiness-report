import z from 'zod';

export namespace Schema {
  export const CommitId = z.string().min(40).max(40);
  export const AttachmentId = z.string().min(1).max(1024);
  export const UnixTimestampMS = z.number().min(0);
  export const DurationMS = z.number().min(0);
  // While the number is 1-based, it doesn't have any
  // limitation on the domain: can be -10, 0 or 10.
  export const Number1Based = z.number();

  // A "no-location" location can be empty.
  export const GitFilePath = z.string().min(0);

  export const Location = z.object({
    file: GitFilePath,
    line: Number1Based, // Note: Locations for file suites are (0, 0).
    column: Number1Based,
  });

  export const TestStatus = z.enum(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']);

  export const Environment = z.object({
    name: z.string().min(1).max(512),

    systemData: z.object({
      osName: z.string().optional(),
      osVersion: z.string().optional(),
      osArch: z.string().optional(),
    }).optional(),

    metadata: z.any().optional(),
    userSuppliedData: z.any().optional(),
  });

  export const STDIOEntry = z.union([
    z.object({ text: z.string() }),
    z.object({ buffer: z.string() })
  ]);

  export const ReportError = z.object({
    location: Location.optional(),

    message: z.string().optional(),

    stack: z.string().optional(),

    snippet: z.string().optional(),

    value: z.string().optional(),
  });

  export const SuiteType = z.enum(['file', 'anonymous suite', 'suite']);

  export const TestStep = z.object({
    title: z.string(),
    duration: DurationMS,
    location: Location.optional(),
    snippet: z.string().optional(),
    error: ReportError.optional(),
    get steps() {
      return z.array(TestStep).optional();
    },
  });

  export const Attachment = z.object({
    name: z.string(),
    contentType: z.string(),
    id: AttachmentId,
  });

  export const Annotation = z.object({
    type: z.string(),
    description: z.string().optional(),
    location: Location.optional(),
  });

  export const RunAttempt = z.object({
    // Index of the environment in the environments array (must be >= 0).
    environmentIdx: z.number().min(0),

    expectedStatus: TestStatus,
    status: TestStatus,
    startTimestamp: UnixTimestampMS,
    duration: DurationMS,

    timeout: DurationMS.optional(),

    annotations: z.array(Annotation).optional(),
    errors: z.array(ReportError).optional(),

    parallelIndex: z.number().optional(),
    steps: z.array(TestStep).optional(),

    stdout: z.array(STDIOEntry).optional(),
    stderr: z.array(STDIOEntry).optional(),
    attachments: z.array(Attachment).optional(),
  });

  export const Suite = z.object({
    type: SuiteType,
    title: z.string(),
    location: Location.optional(),

    get suites() { return z.array(Suite).optional(); },
    get tests() { return  z.array(Test).optional(); }
  })

  export const Test = z.object({
    title: z.string(),
    location: Location.optional(),

    tags: z.array(z.string()).optional(),
    attempts: z.array(RunAttempt),
  });

  export const SystemUtilizationSample = z.object({
    dts: DurationMS,
    // Must be between 0 and 100 (inclusive). Can be a rational number.
    cpuUtilization: z.number().min(0).max(100),
    // Must be between 0 and 100 (inclusive). Can be a rational number.
    memoryUtilization: z.number().min(0).max(100),
  });
  export const SystemUtilization = z.object({
    totalMemoryBytes: z.number().min(0),
    startTimestamp: UnixTimestampMS,
    samples: z.array(SystemUtilizationSample),
  });

  export const UtilizationTelemetry = z.tuple([DurationMS, z.number().min(0).max(100)]);

  export const Report = z.object({
    category: z.string().min(1).max(100),
    version: z.literal(1),
    commitId: CommitId,
    relatedCommitIds: z.array(CommitId).optional(),
    configPath: GitFilePath.optional(),
    url: z.string().optional(),
    environments: z.array(Environment),
    suites: z.array(Suite),
    tests: z.array(Test).optional(),
    unattributedErrors: z.array(ReportError).optional(),
    startTimestamp: UnixTimestampMS,
    duration: DurationMS,
    systemUtilization: z.optional(SystemUtilization),
    cpuCount: z.number().min(0).optional(),
    cpuAvg: z.array(UtilizationTelemetry).optional(),
    cpuMax: z.array(UtilizationTelemetry).optional(),
    ram: z.array(UtilizationTelemetry).optional(),
    ramBytes: z.number().min(0).optional(),
  });
}
