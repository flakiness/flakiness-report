import { z } from 'zod/v4';
import { schema } from './schema.js';

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

  export const NO_LOCATION: Location = {
    file: '' as GitFilePath,
    line: 0 as Number1Based,
    column: 0 as Number1Based,
  }

  export const CATEGORY_PLAYWRIGHT = 'playwright';
  export const CATEGORY_JUNIT = 'junit';
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
  export type TestOutcome = 'skipped' | 'expected' | 'unexpected' | 'flaky';

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

  export interface SystemUtilizationSample {
    /**
     * Timestamp deltas from previous sample timestamp. The very first sample contains delta from
     * `SystemUtilization.startTimestamp`.
     */
    dts: FlakinessReport.DurationMS,
    /**
     * A number between 0 and 100 that represents system cpu utilization in percents. Can be rational.
     */
    cpuUtilization: number,
    /**
     * A number between 0 and 100 that represents system memory utilization in percents. Can be rational.
     */
    memoryUtilization: number,
  }

  export interface SystemUtilization {
    totalMemoryBytes: number,
    startTimestamp: UnixTimestampMS,
    samples: SystemUtilizationSample[],
  }

  /**
   * Report itself.
   */
  export interface Report {
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
     *  Root configuration file that was used to run tests.
     *  In Playwright world, this is the path to the `playwright.config.ts` file, if any.
     */
    configPath?: GitFilePath;

    /**
     * This is the URL of the job that generated this report.
     */
    url?: string;

    /**
     * List of all environments that were used to run tests.
     * In Playwright world, single config file might define multiple projects; each of this projects 
     */
    environments: Environment[], // A list of environments that were used to run tests.

    suites: Suite[];

    unattributedErrors: ReportError[];

    /**
     * Unix timestamp
     */
    startTimestamp: UnixTimestampMS;
    duration: DurationMS;

    /**
     * This is the opaque data that is attached to the report.
     * 
     * Playwright: this is Playwright's configuration.
     */
    opaqueData?: any,

    systemUtilization?: SystemUtilization,
  }

  export type SuiteType = 'file' | 'anonymous suite' | 'suite';

  export interface Suite {
    type: SuiteType,
    title: string;
    location: Location;

    suites?: Suite[];
    tests?: Test[];
  }

  export interface Test {
    title: string;
    // Test location is a must.
    // If for some reason, your tests don't have location.. well, this sucks,
    // but feel free to report NO_LOCATION instead: { file: '', line: 0, column: 0 }.
    location: Location;

    tags?: string[],
    attempts: RunAttempt[];
  }

  export interface Annotation {
    type: string,
    description?: string,
    location?: Location,
  }

  export interface Attachment {
    name: string;
    contentType: string;
    id: AttachmentId;
  }

  export interface RunAttempt {
    // Index of the environment in the environments array.
    environmentIdx: number;
    expectedStatus: TestStatus;
    status: TestStatus;
    startTimestamp: UnixTimestampMS; // Unix timestamp
    duration: DurationMS; // milliseconds

    timeout?: DurationMS;
    annotations?: Annotation[],

    /**
     * These are all the errors during test execution.
     * In typical test, there might be only one error.
     * However, in Playwright world, there might be soft errors, and these will be here as well.
     */
    errors?: ReportError[];

    parallelIndex?: number;
    steps?: TestStep[];

    stdout?: STDIOEntry[];
    stderr?: STDIOEntry[];
    attachments?: Attachment[];
  }

  export interface TestStep {
    title: string;
    duration: DurationMS;
    location?: Location;
    snippet?: string;
    error?: ReportError;
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
     * Error location in the source code.
     */
    location?: Location;

    /**
     * Error message. Set when [Error] (or its subclass) has been thrown.
     */
    message?: string;

    /**
     * Error stack. Set when [Error] (or its subclass) has been thrown.
     */
    stack?: string;

    snippet?: string;

    /**
     * The value that was thrown. Set when anything except the [Error] (or its subclass) has been thrown.
     */
    value?: string;
  }

  export function findTest(report: FlakinessReport.Report, testPredicate: (test: FlakinessReport.Test, parentSuites: FlakinessReport.Suite[]) => boolean): Test | undefined {
    function visitSuite(suite: FlakinessReport.Suite, parents: FlakinessReport.Suite[]): FlakinessReport.Test|undefined {
      for (const test of suite.tests ?? []) {
        if (testPredicate(test, parents))
          return test;
      }
      parents.push(suite);
      for (const childSuite of suite.suites ?? []) {
        const test = visitSuite(childSuite, parents);
        if (test)
          return test;
      }
      parents.pop();
    }
    for (const suite of report.suites) {
      const test = visitSuite(suite, []);
      if (test)
        return test;
    }
  }

  export function visitTests(report: FlakinessReport.Report, testVisitor: (test: FlakinessReport.Test, parentSuites: FlakinessReport.Suite[]) => void) {
    function visitSuite(suite: FlakinessReport.Suite, parents: FlakinessReport.Suite[]) {
      parents.push(suite);
      for (const test of suite.tests ?? [])
        testVisitor(test, parents);
      for (const childSuite of suite.suites ?? [])
        visitSuite(childSuite, parents);
      parents.pop();
    }
    for (const suite of report.suites)
      visitSuite(suite, []);
  }

  export async function visitTestsAsync(report: FlakinessReport.Report, testVisitor: (test: FlakinessReport.Test, parentSuites: FlakinessReport.Suite[]) => Promise<void>) {
    async function visitSuite(suite: FlakinessReport.Suite, parents: FlakinessReport.Suite[]) {
      for (const test of suite.tests ?? [])
        await testVisitor(test, parents);
      parents.push(suite);
      for (const childSuite of suite.suites ?? [])
        await visitSuite(childSuite, parents);
      parents.pop();
    }
    for (const suite of report.suites)
      await visitSuite(suite, []);
  }

  /**
   * Either returns error if the object doesn't match schema,
   * or undefined.
   */
  export function validate(report: Report): string|undefined {
    const validation = schema.Report.safeParse(report);
    if (!validation.success)
      return z.prettifyError(validation.error);
    return undefined;
  }

  export function jsonSchema(): any|undefined {
    return z.toJSONSchema(schema.Report);
  }
}

