# Contributing

## How to Build & Watch Code

### Build

To build the package:

```bash
npm run build
```

This will compile TypeScript source files and generate:
- JavaScript output in the `lib/` directory
- TypeScript declaration files in the `types/` directory

The build process is driven by [kubik](https://github.com/flakiness/kubik), which is used to execute the build scripts.

### Watch

To automatically rebuild on file changes:

```bash
npm run watch
```

This will watch the `src/` directory and automatically rebuild whenever you make changes to the TypeScript files.

## How to Deploy the Project

### 1. Update Version

Create a commit that updates the version number in `package.json` and updates `package-lock.json`:

```bash
# Update the version in package.json (e.g., change "0.11.2" to "0.12.0")
# Then run:
npm install

# Commit the changes
git add package.json package-lock.json
git commit -m "chore: mark v0.12.0"
```

### 2. Push the Commit

```bash
git push
```

### 3. Create a GitHub Release

1. Go to the GitHub repository
2. Click on "Releases" → "Draft a new release"
3. Create a new tag with the same version (e.g., `v0.12.0`)
4. Use the same version number as the commit message (e.g., "v0.12.0")
5. Optionally add release notes
6. Click "Publish release"

### 4. Automatic NPM Publication

Once the release is published, the GitHub Actions workflow will automatically:
- Trigger on the new tag
- Build the package
- Publish to npm

No manual steps required after publishing the GitHub release.

