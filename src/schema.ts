import z from 'zod/v4';

export namespace schema {
  export const CommitId = z.string().min(40).max(40);
  export const AttachmentId = z.string().min(1).max(1024);
  export const UnixTimestampMS = z.number().min(0);
  export const DurationMS = z.number().min(0);
  // While the number is 1-based, it doesn't have any
  // limitation on the domain: can be -10, 0 or 10.
  export const Number1Based = z.number();

  // A "no-location" location can be empty.
  export const GitFilePath = z.string().min(0);

  /**
   * Represents a location in the source code.
   */
  export const Location = z.object({
    file: GitFilePath,
    line: Number1Based, // Note: Locations for file suites are (0, 0).
    column: Number1Based,
  });

  /**
   * Represents attempt result.
   */
  export const TestStatus = z.enum(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']);

  /**
   * Represents test environment that was used to execute test.
   * The environment is indexed and searchable, with an opaque non-indexed data attached into `opaqueData`.
   */
  export const Environment = z.object({
    /**
     * In Playwright world, there are so-called "projects": a way to run the same tests in different configurations and
     * generate a single report for them. These projects might have names, and this is where it might come.
     * If there's no name, then some other one must be provided instead.
     */
    name: z.string().min(1).max(512),

    /**
     * System data is automatically collected by test reporter. This is indexed by the FQL.
     */
    systemData: z.object({
      osName: z.string().optional(),
      osVersion: z.string().optional(),
      osArch: z.string().optional(),
    }).optional(),

    /**
     * User-supplied data is the data that is supplied by users. This is indexed by the FQL.
     * - In Playwright world, this might be coming from project's metadata field.
     * - It can also be populated via the FK_ENV_FOO="bar" env variables, setting the "foo: bar" key-value pair.
     */
    userSuppliedData: z.any().optional(),

    /**
     * This is the opaque data that is not indexed and that comes from the test framework. This is NOT INDEXED by FQL.
     * 
     * Playwright: this is Playwright's per-project configuration.
     */
    opaqueData: z.any().optional(),
  });

  /**
   * If the entry is a binary data, then it is base64-encoded in "buffer"; otherwise, it's a text entry.
   */
  export const STDIOEntry = z.union([
    z.object({ text: z.string() }),
    z.object({ buffer: z.string() })
  ]);

  /**
   * Information about an error thrown during test execution.
   */
  export const ReportError = z.object({
    /**
     * Error location in the source code.
     */
    location: Location.optional(),

    /**
     * Error message. Set when [Error] (or its subclass) has been thrown.
     */
    message: z.string().optional(),

    /**
     * Error stack. Set when [Error] (or its subclass) has been thrown.
     */
    stack: z.string().optional(),

    snippet: z.string().optional(),

    /**
     * The value that was thrown. Set when anything except the [Error] (or its subclass) has been thrown.
     */
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
    location: z.optional(Location),
  });

  export const RunAttempt = z.object({
    timeout: DurationMS.optional(),
    annotations: z.array(Annotation),
    expectedStatus: TestStatus,
    // Index of the environment in the environments array.
    environmentIdx: z.number().min(0),

    status: TestStatus,
    startTimestamp: UnixTimestampMS,
    duration: DurationMS,

    /**
     * These are all the errors during test execution.
     * In typical test, there might be only one error.
     * However, in Playwright world, there might be soft errors, and these will be here as well.
     */
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
    location: Location,

    get suites() { return z.array(Suite).optional(); },
    get tests() { return  z.array(Test).optional(); }
  })

  export const Test = z.object({
    title: z.string(),
    location: Location,

    tags: z.array(z.string()).optional(),
    attempts: z.array(RunAttempt),
  });

  export const SystemUtilizationSample = z.object({
    /**
     * Timestamp deltas from previous sample timestamp. The very first sample contains delta from
     * `SsytemUtilization.startTimestamp`.
     */
    dts: DurationMS,
    /**
     * A number between 0 and 100 that represents cpu utilization in percents. Can be rational.
     */
    cpuUtilization: z.number().min(0).max(100),
    /**
     * A number between 0 and 100 that represents memory utilization in percents. Can be rational.
     */
    memoryUtilization: z.number().min(0).max(100),
  });

  export const SystemUtilization = z.object({
    totalMemoryBytes: z.number().min(0),
    startTimestamp: UnixTimestampMS,
    samples: z.array(SystemUtilizationSample),
  });

  /**
   * Report itself.
   */
  export const Report = z.object({
    /**
     * Report category. Cannot be empty.
     */
    category: z.string().min(1).max(100),

    /**
     * Commit of the repository containing tests, used for linking to test sources.
     */
    commitId: CommitId,

    /**
     * Commits of related repositories being tested (e.g., server code in a separate repo).
     * Used when tests and tested code are in different repositories.
     */
    relatedCommitIds: z.array(CommitId).optional(),

    /**
     *  Root configuration file that was used to run tests.
     *  In Playwright world, this is the path to the `playwright.config.ts` file, if any.
     */
    configPath: GitFilePath.optional(),

    /**
     * This is the URL of the job that generated this report.
     */
    url: z.string().optional(),

    /**
     * List of all environments that were used to run tests.
     * In Playwright world, single config file might define multiple projects; each of this projects 
     */
    environments: z.array(Environment), // A list of environments that were used to run tests.

    suites: z.array(Suite),

    unattributedErrors: z.array(ReportError),

    /**
     * Unix timestamp
     */
    startTimestamp: UnixTimestampMS,
    duration: DurationMS,

    /**
     * This is the opaque data that is attached to the report.
     * 
     * Playwright: this is Playwright's configuration.
     */
    opaqueData: z.any().optional(),

    systemUtilization: z.optional(SystemUtilization),
  });
}
