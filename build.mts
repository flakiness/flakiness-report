#!/usr/bin/env -S npx kubik

import path from 'path';
import esbuild from 'esbuild';
import fs from 'fs';
import { Task } from 'kubik';

const { __dirname, $ } = Task.init(import.meta, {
  name: 'report',
  watch: [ './src' ],
});

const outDir = path.join(__dirname, 'lib');
const typesDir = path.join(__dirname, 'types');
const srcDir = path.join(__dirname, 'src');
await fs.promises.rm(outDir, { recursive: true, force: true });
await fs.promises.rm(typesDir, { recursive: true, force: true });

const { errors } = await esbuild.build({
  color: true,
  entryPoints: [
    path.join(srcDir, '**/*.ts'),
  ],
  packages: 'external',
  outdir: outDir,
  format: 'esm',
  platform: 'node',
  target: ['node24'],
  sourcemap: true,
  bundle: false,
  minify: false,
});

if (!errors.length)
  await $`tsc --pretty -p .`;
