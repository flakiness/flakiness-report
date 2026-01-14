# Contributing

## How to Build & Watch Code

### Build

To build the package:

```bash
pnpm run build
```

This will compile TypeScript source files and generate:
- JavaScript output in the `lib/` directory
- TypeScript declaration files in the `types/` directory

The build process is driven by [kubik](https://github.com/flakiness/kubik), which is used to execute the build scripts.

### Watch

To automatically rebuild on file changes:

```bash
pnpm run watch
```

This will watch the `src/` directory and automatically rebuild whenever you make changes to the TypeScript files.

## How to Deploy the Project

```bash
# The following will bump version, create commit, tag, and push tag
# to the CI. The version will auto-published to the NPM.
pnpm run minor # or patch, or major-major-major
```

