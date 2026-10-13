import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {excludeRuntime} from './package-policy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const stage = path.join(root, '.build/package');
await fs.rm(stage, {recursive:true, force:true});
await fs.mkdir(stage, {recursive:true});
const runtime = path.join(root, 'runtime');
const removed = [];
await fs.cp(runtime, path.join(stage, 'runtime'), {
  recursive:true, verbatimSymlinks:true,
  filter:async source => {
    const relative = path.relative(runtime, source).split(path.sep).join('/');
    if (!excludeRuntime(relative)) return true;
    removed.push(relative);
    return false;
  },
});

// RubyGems entry points must use the adjacent bundled interpreter after a move.
async function relocateLaunchers(directory) {
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (!entry.isFile()) continue;
    let text = await fs.readFile(file, 'utf8');
    if (!text.startsWith('#!') || !/^#![^\n]*ruby/m.test(text)) continue;
    const relative = path.relative(directory, path.join(stage, 'runtime/ruby/bin/ruby')).split(path.sep).join('/');
    if (text.startsWith('#!/bin/sh') && text.includes('=end\n')) text = text.slice(text.indexOf('=end\n') + 5);
    text = text.replace(/^#![^\n]*ruby[^\n]*\n/, '#!/usr/bin/env ruby\n');
    const prelude = '#!/bin/sh\n# -*- ruby -*-\n_=_\\\n=begin\nscript_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec "$script_dir/' + relative + '" -x "$0" "$@"\n=end\n';
    await fs.writeFile(file, prelude + text, {mode:0o755});
  }
}
await relocateLaunchers(path.join(stage, 'runtime/ruby/bin'));
await relocateLaunchers(path.join(stage, 'runtime/gems/bin'));

// Native gems install identical extensions in both lib/ and extensions/.
// Keep one copy and use relative links, so moving the app stays safe.
const groups = new Map();
const links = [];
async function dedupe(directory) {
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await dedupe(file);
    else if (entry.isFile() && /\.(?:bundle|so)$/.test(entry.name)) {
      const buffer = await fs.readFile(file);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const canonical = groups.get(hash);
      if (canonical) {
        const target = path.relative(path.dirname(file), canonical);
        await fs.unlink(file);
        await fs.symlink(target, file);
        links.push({file:path.relative(stage, file), target, bytes:buffer.length});
      } else groups.set(hash, file);
    }
  }
}
await dedupe(path.join(stage, 'runtime/gems'));
await fs.cp(path.join(root, 'LICENSES'), path.join(stage, 'LICENSES'), {recursive:true});

// UI libraries are bundled into dist/; keep their notices even though their
// development package trees are no longer installed in the shipped app.
const notices = path.join(stage, 'LICENSES/npm');
await fs.mkdir(notices, {recursive:true});
const catalog = [];
async function collect(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const folder = path.join(directory, entry.name);
    if (entry.name.startsWith('@')) {await collect(folder, entry.name + '/'); continue;}
    const name = prefix + entry.name;
    if (name === 'electron') continue; // Electron/Chromium notices already retained.
    let pkg;
    try {pkg = JSON.parse(await fs.readFile(path.join(folder, 'package.json'), 'utf8'));} catch {continue;}
    const filenames = (await fs.readdir(folder)).filter(n => /^(?:licen[cs]e|copying|notice|copyright)(?:[._-]|$)/i.test(n));
    for (const filename of filenames) {
      const source = path.join(folder, filename);
      if ((await fs.stat(source)).isFile()) {
        const destination = path.join(notices, name, filename);
        await fs.mkdir(path.dirname(destination), {recursive:true});
        await fs.copyFile(source, destination);
      }
    }
    catalog.push({name:pkg.name, version:pkg.version, license:pkg.license, notices:filenames});
  }
}
await collect(path.join(root, 'node_modules'));
await fs.writeFile(path.join(notices, 'versions.json'), JSON.stringify(catalog, null, 2));
await fs.writeFile(path.join(stage, 'report.json'), JSON.stringify({removed, links}, null, 2));
console.log('Prepared lean runtime; moved build-only files:', removed.length, '; deduplicated native extensions:', links.length);
