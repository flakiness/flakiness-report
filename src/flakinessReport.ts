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
   * The environment is indexed and searchable.
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
     * @deprecated Please use `metadata` instead.
     */
    userSuppliedData?: Record<string, string|boolean|number>,

    /**
     * Metadata that defines execution environment. See
     * https://flakiness.io/docs/concepts/environments/ for details.
     *
     * By convention, report generators should parse environment variables and
     * record `FK_ENV_*` as metadata. For example, the `FK_ENV_FOO=bar` should
     * be recorded as `foo: "bar"` in the metadata.
     */
    metadata?: Record<string, string|boolean|number>,
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
   * Number between 0 and 100 representing percentage.
   */
  type Percent = number;

  /**
   * Telmetry is an array that encodes a variation of certain value in time.
   * The very first tuple has the format:
   * - Index 0: Unix timestamp (ms) when telemetry started
   * - Index 1: Tracked value 
   * 
   * Every other tuple has the format:
   * - Index 0: Time passed (ms) since the previous sample (delta).
   * - Index 1: Tracked value
   */
  export type Telemetry<VALUE> = [number, VALUE][];

  export interface Source {
    /**
     * File path of the source file, relative to git checkout (unix-based).
     * This should match the `file` field in `Location` objects that reference this source.
     */
    filePath: GitFilePath,

    /**
     * The actual source code content of the file.
     * Can be the full file content or a partial excerpt (see `lineOffset`).
     */
    text: string,

    /**
     * Optional line offset indicating the starting line number if only a portion of the file is included.
     * For example, if `lineOffset` is 10, then the first line of `text` corresponds to line 10 of the original file.
     * If omitted, the content is assumed to start at line 1.
     */
    lineOffset?: number,

    /**
     * Optional MIME type of the source file content (e.g., 'text/javascript', 'text/typescript', 'text/python').
     * Used by the report viewer for syntax highlighting and proper rendering.
     * If undefined, then Report viewer will try to guess mime type from file path.
     */
    contentType?: string;
  }

  /**
   * The root report object containing all test execution data.
   */
  export interface Report {
    version: 1;

    /**
     * Optional array of source code files embedded in the report.
     * These sources provide context for locations referenced throughout the report
     * (e.g., test definitions, error locations, step locations).
     * 
     * This field replaces the deprecated `snippet` fields in `TestStep` and `ReportError`,
     * allowing for better code navigation and context display in the report viewer.
     */
    sources?: Source[],

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
    suites?: Suite[];

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
     * System resource utilization data collected during test execution.
     * Includes CPU and memory usage samples taken at regular intervals.
     * @deprecated Please use `cpuAvg`, `cpuMax` and `ram` instead to report
     * system telemetry.
     */
    systemUtilization?: SystemUtilization,

    /**
     * Number of CPUs on the system.
     */
    cpuCount?: number,

    /**
     * Average CPU utilization during test execution.
     * Represents general system load and helps identify sustained high CPU usage
     * that might indicate resource constraints or inefficient test execution.
     * Encodes percentage of avg cpu utilization across all CPUs.
     */
    cpuAvg?: Telemetry<Percent>;

    /**
     * Peak CPU utilization during test execution.
     * Used for bottleneck detection to identify moments of maximum CPU stress
     * that could cause test timeouts or flakiness.
     * Encodes percentage of max cpu utilization.
     */
    cpuMax?: Telemetry<Percent>;

    /**
     * RAM utilization during test execution.
     * Tracks memory usage over time to help identify memory leaks, excessive memory consumption,
     * or insufficient memory that might cause test failures or instability.
     * Encodes percentage of total memory in use.
     */
    ram?: Telemetry<Percent>;

    /**
     * Total system memory in bytes.
     */
    ramBytes?: number;
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
     * @deprecated attach a source to top-level `sources` field instead.
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
     * @deprecated attach a source to top-level `sources` field instead.
     */
    snippet?: string;

    /**
     * String representation of the value that was thrown.
     * Set when anything except [Error] (or its subclass) has been thrown.
     */
    value?: string;
  }
}
