/**
 * Brands a type by intersecting it with a type with a brand property based on
 * the provided brand string.
 */
type Brand<T, Brand extends string> = T & {
  readonly [B in Brand as `__${B}_brand`]: never;
};

export namespace FlakinessReport {
  export type CommitId = Brand<string, 'FlakinessReport.CommitId'>;
  export type AttachmentId = Brand<string, 'FlakinessReport.AttachmentId'>;
  export type UnixTimestampMS = Brand<number, 'FlakinessReport.UnixTimestampMS'>;
  export type DurationMS = Brand<number, 'FlakinessReport.DurationMS'>;
  export type Number1Based = Brand<number, 'FlakinessReport.Number1Based'>;
  export type GitFilePath = Brand<string, 'FlakinessReport.GitFilePath'>;

  /**
   * Report category for Playwright test reports.
   */
  export const CATEGORY_PLAYWRIGHT = 'playwright';
  /**
   * Report category for PyTest test reports.
   */
  export const CATEGORY_PYTEST = 'pytest';
  /**
   * Report category for JUnit test reports.
   */
  export const CATEGORY_JUNIT = 'junit';
  /**
   * Report category for performance test reports.
   */
  export const CATEGORY_PERF = 'perf';

  /**
   * Represents a location in the source code.
   */
  export interface Location {
    /**
     * Path to the source file, relative to git checkout, unix-based.
     */
    file: GitFilePath;

    /**
     * Line number in the source file (1-based).
     */
    line: Number1Based;

    /**
     * Column number in the source file (1-based).
     */
    column: Number1Based;
  }

  /**
   * Represents a test execution outcome.
   */
  export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

  /**
   * Represents test environment that was used to execute test.
   * The environment is indexed and searchable, with an opaque non-indexed data attached into `opaqueData`.
   */
  export type Environment = {
    /**
     * In Playwright world, there are so-called "projects": a way to run the same tests in different configurations and
     * generate a single report for them. These projects might have names, and this is where it might come.
     * If there's no name, then some other one must be provided instead.
     */
    name: string,

    /**
     * System data is automatically collected by test reporter. This is indexed by the FQL.
     */
    systemData?: {
      osName?: string,
      osVersion?: string,
      osArch?: string,
    },

    /**
     * User-supplied data is the data that is supplied by users. This is indexed by the FQL.
     * - In Playwright world, this might be coming from project's metadata field.
     * - It can also be populated via the FK_ENV_FOO="bar" env variables, setting the "foo: bar" key-value pair.
     */
    userSuppliedData?: Record<string, string|boolean|number>,

    /**
     * This is the opaque data that is not indexed and that comes from the test framework. This is NOT INDEXED by FQL.
     * 
     * Playwright: this is Playwright's per-project configuration.
     */
    opaqueData?: any,
  }

  /**
   * Represents a single sample of system resource utilization at a point in time.
   */
  export interface SystemUtilizationSample {
    /**
     * Timestamp delta from previous sample timestamp. The very first sample contains delta from
     * `SystemUtilization.startTimestamp`.
     */
    dts: DurationMS,
    /**
     * A number between 0 and 100 that represents system CPU utilization in percents. Can be rational.
     */
    cpuUtilization: number,
    /**
     * A number between 0 and 100 that represents system memory utilization in percents. Can be rational.
     */
    memoryUtilization: number,
  }

  /**
   * Represents system resource utilization monitoring data collected during test execution.
   */
  export interface SystemUtilization {
    /**
     * Total system memory in bytes at the start of monitoring.
     */
    totalMemoryBytes: number,
    /**
     * Unix timestamp when monitoring started.
     */
    startTimestamp: UnixTimestampMS,
    /**
     * Array of utilization samples taken at regular intervals during test execution.
     */
    samples: SystemUtilizationSample[],
  }

  /**
   * The root report object containing all test execution data.
   */
  export interface Report {
    version?: undefined;

    /**
     * Report category identifier (e.g., 'playwright', 'junit', 'perf').
     * See `CATEGORY_*` constants for predefined categories.
     */
    category: string;

    /**
     * Commit of the repository containing tests, used for linking to test sources.
     */
    commitId: CommitId,

    /**
     * Commits of related repositories being tested (e.g., server code in a separate repo).
     * Used when tests and tested code are in different repositories.
     */
    relatedCommitIds?: CommitId[],

    /**
     * Root configuration file that was used to run tests.
     * In Playwright world, this is the path to the `playwright.config.ts` file, if any.
     */
    configPath?: GitFilePath;

    /**
     * URL of the job or CI/CD run that generated this report.
     */
    url?: string;

    /**
     * List of all environments that were used to run tests.
     * In Playwright world, a single config file might define multiple projects; each of these projects
     * becomes an environment entry in this array.
     */
    environments: Environment[];

    /**
     * Root test suites in the report. Suites can be nested and contain both sub-suites and tests.
     */
    suites: Suite[];

    /**
     * Root test in the report - these do not belong to any suite.
     */
    tests?: Test[];

    /**
     * Errors that occurred during test execution but could not be attributed to a specific test.
     * These are typically infrastructure or setup errors.
     */
    unattributedErrors?: ReportError[];

    /**
     * Unix timestamp (in milliseconds) when test execution started.
     */
    startTimestamp: UnixTimestampMS;
    
    /**
     * Total duration of test execution in milliseconds.
     */
    duration: DurationMS;

    /**
     * Opaque data that is attached to the report.
     * This data is not indexed or validated by the schema.
     * 
     * Playwright: this is Playwright's configuration.
     */
    opaqueData?: any,

    /**
     * System resource utilization data collected during test execution.
     * Includes CPU and memory usage samples taken at regular intervals.
     */
    systemUtilization?: SystemUtilization,
  }

  /**
   * Type of test suite.
   * - 'file': Suite represents a test file
   * - 'anonymous suite': Suite without a corresponding source location
   * - 'suite': Regular nested suite within a file
   */
  export type SuiteType = 'file' | 'anonymous suite' | 'suite';

  /**
   * Represents a test suite that can contain other suites and/or tests.
   */
  export interface Suite {
    /**
     * Type of this suite.
     */
    type: SuiteType,
    /**
     * Human-readable title of the suite.
     */
    title: string;
    /**
     * Source location of the suite definition.
     * Providing source location makes for the best user experience,
     * so reporters should do their best to infer them.
     */
    location?: Location;

    /**
     * Nested sub-suites within this suite.
     */
    suites?: Suite[];
    /**
     * Tests contained directly in this suite.
     */
    tests?: Test[];
  }

  /**
   * Represents a single test case.
   */
  export interface Test {
    /**
     * Human-readable title of the test.
     */
    title: string;
    /**
     * Source location of the test definition.
     * Providing source location makes for the best user experience,
     * so reporters should do their best to infer them.
     */
    location?: Location;

    /**
     * Optional tags associated with this test for categorization and filtering.
     */
    tags?: string[],
    /**
     * All execution attempts of this test across different environments.
     * Each attempt represents one run of the test in a specific environment.
     */
    attempts: RunAttempt[];
  }

  /**
   * Metadata annotation attached to a test run.
   * Used to provide additional context or mark special conditions (e.g., 'skip', 'slow', 'fixme').
   */
  export interface Annotation {
    /**
     * Type of annotation (e.g., 'skip', 'slow', 'fixme').
     */
    type: string,
    /**
     * Optional human-readable description of the annotation.
     */
    description?: string,
    /**
     * Optional location in source code where this annotation was defined or applied.
     */
    location?: Location,
  }

  /**
   * Reference to an attachment (screenshot, video, log, etc.) associated with a test run.
   * The actual attachment content is stored separately and retrieved using the attachment ID.
   */
  export interface Attachment {
    /**
     * Filename of the attachment.
     */
    name: string;
    /**
     * MIME type of the attachment content (e.g., 'image/png', 'video/webm', 'text/plain').
     */
    contentType: string;
    /**
     * Unique identifier used to retrieve the actual attachment content.
     */
    id: AttachmentId;
  }

  /**
   * Represents a single execution attempt of a test in a specific environment.
   */
  export interface RunAttempt {
    /**
     * Index of the environment in the report's `environments` array used for this attempt.
     */
    environmentIdx: number;
    /**
     * Expected status for this test (what the test was supposed to do).
     */
    expectedStatus: TestStatus;
    /**
     * Actual status that resulted from this test execution.
     */
    status: TestStatus;
    /**
     * Unix timestamp (in milliseconds) when this test attempt started.
     */
    startTimestamp: UnixTimestampMS;
    /**
     * Duration of this test attempt in milliseconds.
     */
    duration: DurationMS;

    /**
     * Maximum allowed duration (timeout) for this test attempt in milliseconds.
     */
    timeout?: DurationMS;
    /**
     * Annotations attached to this test run.
     */
    annotations?: Annotation[],

    /**
     * All errors that occurred during test execution.
     * In typical tests, there might be only one error.
     * However, in Playwright world, there might be soft errors, and these will be here as well.
     */
    errors?: ReportError[];

    /**
     * Index of this test when running in parallel (if applicable).
     * Used to identify which parallel worker executed this attempt.
     */
    parallelIndex?: number;
    /**
     * Nested test steps that were executed as part of this test attempt.
     */
    steps?: TestStep[];

    /**
     * Standard output captured during test execution.
     */
    stdout?: STDIOEntry[];
    /**
     * Standard error output captured during test execution.
     */
    stderr?: STDIOEntry[];
    /**
     * Attachments generated during this test attempt (screenshots, videos, logs, etc.).
     */
    attachments?: Attachment[];
  }

  /**
   * Represents a step within a test execution (e.g., "click button", "fill form").
   * Steps can be nested to represent hierarchical test actions.
   */
  export interface TestStep {
    /**
     * Human-readable title describing what this step does.
     */
    title: string;
    /**
     * Duration of this step in milliseconds.
     */
    duration: DurationMS;
    /**
     * Optional source location where this step was defined or executed.
     */
    location?: Location;
    /**
     * Optional code snippet showing the step implementation.
     */
    snippet?: string;
    /**
     * Optional error that occurred during this step execution.
     */
    error?: ReportError;
    /**
     * Nested sub-steps within this step.
     */
    steps?: TestStep[];
  }

  /**
   * If the entry is a binary data, then it is base64-encoded in "buffer"; otherwise, it's a text entry.
   */
  export type STDIOEntry = { text: string } | { buffer: string };

  /**
   * Information about an error thrown during test execution.
   */
  export interface ReportError {
    /**
     * Error location in the source code where the error occurred.
     */
    location?: Location;

    /**
     * Error message. Set when [Error] (or its subclass) has been thrown.
     */
    message?: string;

    /**
     * Error stack trace. Set when [Error] (or its subclass) has been thrown.
     */
    stack?: string;

    /**
     * Code snippet showing the context around where the error occurred.
     */
    snippet?: string;

    /**
     * String representation of the value that was thrown.
     * Set when anything except [Error] (or its subclass) has been thrown.
     */
    value?: string;
  }
}

