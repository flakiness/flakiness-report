import { FlakinessReport as V0 } from "./v0/flakinessReport.js";

export function migrateToV0(input: V0.Report): V0.Report {
  // noop!
  return input;
}

