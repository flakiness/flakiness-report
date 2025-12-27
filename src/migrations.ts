import { V0 } from "./v0/reportV0.js";
import { V1 } from './v1/reportV1.js';

export function migrateToV0(input: V0.Report): V0.Report {
  // noop!
  return input;
}

export function migrateToV1(input: V0.Report|V1.Report): V1.Report {
  if (input.version === 1)
    return input;
  input = structuredClone(input);

  delete input.opaqueData;
  for (const env of input.environments)
    delete env.opaqueData;

  return {
    ...input,
    environments: input.environments.map(env => ({
      ...env,
      userSuppliedData: undefined,
      metadata: env.userSuppliedData,
    })),
    version: 1,
  };
}
