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
   * Represents a location in the source code.
   */
  export interface Location {
    /**
     * Path to the source file, relative to the repository root (using forward slashes).
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
   * Represents the test environment used to execute a test.
   */
  export type Environment = {
    /**
     * Environment name.
     * In Playwright, "projects" allow running the same tests in different configurations
     * and generating a single report; the project name is typically used here.
     * If no project name is available, provide another meaningful identifier.
     */
    name: string,

    /**
     * System data automatically collected by the test reporter.
     * This data is indexed and queryable via the Flakiness Query Language (FQL).
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
   * @deprecated Use CPUUtilization and RAMUtilization instead.
   */
  export interface SystemUtilizationSample {
    /**
     * Timestamp delta from previous sample timestamp. The very first sample contains delta from
     * `SystemUtilization.startTimestamp`.
     */
    dts: DurationMS,
    /**
     * System CPU utilization as a percentage (0–100). Can be a decimal.
     */
    cpuUtilization: number,
    /**
     * System memory utilization as a percentage (0–100). Can be a decimal.
     */
    memoryUtilization: number,
  }

  /**
   * Represents system resource utilization monitoring data collected during test execution.
   * @deprecated Use CPUUtilization and RAMUtilization instead.
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
   * A time series encoded as an array of `[timestamp, value]` tuples.
   *
   * To save space, timestamps use delta encoding:
   * - **First tuple**: `[absoluteTimestamp, value]` — Unix timestamp in ms
   * - **Subsequent tuples**: `[deltaMs, value]` — milliseconds since the previous sample
   *
   * Example: `[[1704067200000, 25], [1000, 30], [1000, 28]]`
   * represents values 25, 30, 28 sampled at times T, T+1s, T+2s.
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
     * If omitted, the report viewer will infer the MIME type from the file path.
     */
    contentType?: string;
  }

  /**
   * The root report object containing all test execution data.
   */
  export interface Report {
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
     * Root configuration file used to run the tests.
     */
    configPath?: GitFilePath;

    /**
     * URL of the job or CI/CD run that generated this report.
     */
    url?: string;

    /**
     * List of all environments that were used to run tests.
     * At least one environment must be present in this list for the report to be valid.
     */
    environments: Environment[];

    /**
     * Root test suites in the report. Suites can be nested and contain both sub-suites and tests.
     */
    suites?: Suite[];

    /**
     * Root tests in the report that do not belong to any suite.
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
     * Average CPU utilization (0–100%) across all cores, sampled over time.
     */
    cpuAvg?: Telemetry<Percent>;

    /**
     * Peak CPU utilization (0–100%) of the busiest core, sampled over time.
     */
    cpuMax?: Telemetry<Percent>;

    /**
     * RAM utilization (0–100%) as a percentage of `ramBytes`, sampled over time.
     */
    ram?: Telemetry<Percent>;

    /**
     * Total system memory in bytes.
     */
    ramBytes?: number;
  }

  /**
   * Type of test suite.
   * - 'file': Suite representing a test file
   * - 'suite': Named suite defined in source code (e.g., `describe` block)
   * - 'anonymous suite': Unnamed grouping without a corresponding source definition
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
     * Descriptive name of the attachment (often the filename).
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
     * Defaults to `0`.
     */
    environmentIdx?: number;

    /**
     * The status the test was expected to have.
     * Typically `passed`, but can be `failed` for tests marked as "expected to fail".
     * Defaults to `passed`.
     */
    expectedStatus?: TestStatus;

    /**
     * The actual outcome of this test execution.
     * Defaults to `passed`.
     */
    status?: TestStatus;

    /**
     * Unix timestamp (in milliseconds) when this test attempt started.
     */
    startTimestamp: UnixTimestampMS;

    /**
     * Duration of this test attempt in milliseconds.
     * Defaults to `0` if not defined.
     */
    duration?: DurationMS;

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
     * Most tests have at most one error, but frameworks like Playwright support
     * "soft" assertions that record errors without immediately failing the test.
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
     * Defaults to `0`.
     */
    duration?: DurationMS;

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
   * If the entry is binary data, it is base64-encoded in "buffer"; otherwise, it's a text entry.
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
     * Error message. Set when an Error (or subclass) has been thrown.
     */
    message?: string;

    /**
     * Error stack trace. Set when an Error (or subclass) has been thrown.
     */
    stack?: string;

    /**
     * Code snippet showing the context around where the error occurred.
     * Some test runners include ANSI-highlighted snippets that match the error message styling;
     * when available, this field preserves that formatted output.
     * If not provided, consumers should fall back to the `sources` field.
     */
    snippet?: string;

    /**
     * String representation of the value that was thrown.
     * Set when anything except an Error (or subclass) has been thrown.
     */
    value?: string;
  }
}
