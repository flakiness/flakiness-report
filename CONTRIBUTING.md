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

## Releasing

To release a new version:

1. Bump the version:

   ```bash
   # For a stable minor release
   pnpm version minor

   # For an alpha pre-release
   pnpm version preminor --preid=alpha
   ```

2. Push the tag:

   ```bash
   git push --tags
   ```

   CI will handle publishing to npm. Pre-releases are published under @next tag.
