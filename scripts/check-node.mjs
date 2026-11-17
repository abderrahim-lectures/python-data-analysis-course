#!/usr/bin/env node
// Preflight: fail with a message that names the actual problem.
//
// Astro refuses to start below its Node floor, but the message it prints is
// about Astro ("Node.js v22.22.1 is not supported by Astro!"), which sends
// people looking at their Astro install instead of their Node version. The
// floor here is set by package.json#engines, and npm does not enforce engines
// by default, so a machine with 22.22.1 installs cleanly and only discovers
// the problem on the first `npm run dev`.
//
// Run from predev/prebuild so the check happens before any work, and print the
// installed version, the required floor, and how to fix it.
import {readFileSync} from 'node:fs';

const here = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', here), 'utf8'));
const floor = (pkg.engines?.node ?? '').replace(/^>=?\s*/, '');
if (!floor) process.exit(0);

const parse = (v) => v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
const [needMajor, needMinor = 0, needPatch = 0] = parse(floor);
const [haveMajor, haveMinor = 0, havePatch = 0] = parse(process.versions.node);

const tooOld =
  haveMajor < needMajor ||
  (haveMajor === needMajor &&
    (haveMinor < needMinor || (haveMinor === needMinor && havePatch < needPatch)));

if (tooOld) {
  const nvmrc = (() => {
    try { return readFileSync(new URL('.nvmrc', here), 'utf8').trim(); } catch { return floor; }
  })();
  console.error(
    [
      '',
      `This project needs Node >= ${floor}, but you are running ${process.versions.node}.`,
      '',
      'Astro refuses to start below its own floor, and npm does not enforce',
      'package.json#engines, so the failure only appears when a script runs.',
      '',
      'Fix it with one of:',
      `  nvm install ${nvmrc} && nvm use ${nvmrc}     # if you use nvm`,
      `  fnm install ${nvmrc} && fnm use ${nvmrc}     # if you use fnm`,
      '  or install the current LTS from https://nodejs.org and reopen your shell.',
      '',
      'Then re-run the same command.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
