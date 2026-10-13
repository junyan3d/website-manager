import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {excludeRuntime} from './package-policy.mjs';

const target = await fs.realpath(path.resolve(process.argv[2] || 'release/mac-arm64/网站管家.app'));
const privateRepo = process.env.PRIVATE_BUILD_REPO || '';
const markers = [privateRepo, privateRepo.split('/')[1]].filter(Boolean);
const personalHome = process.env.AUDIT_PERSONAL_HOME || os.homedir();
const issues = []; const upstreamPaths = []; let files = 0; let bytes = 0;
const under = p => p === target || p.startsWith(target + path.sep);
async function walk(directory) {
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name); const relative = path.relative(target, file).split(path.sep).join('/');
    if (entry.isSymbolicLink()) {
      const link = await fs.readlink(file);
      if (path.isAbsolute(link) || !under(await fs.realpath(file))) issues.push({file:relative, rule:'non-relocatable-link'});
      continue;
    }
    if (entry.isDirectory()) {await walk(file); continue;}
    if (!entry.isFile()) continue;
    files++; const data = await fs.readFile(file); bytes += data.length;
    const runtime = relative.split('Contents/Resources/runtime/')[1];
    if (['.DS_Store','.eslintcache','mkmf.log','gem_make.out'].includes(entry.name) || relative.includes('/.git/') || (runtime && excludeRuntime(runtime))) issues.push({file:relative,rule:'unnecessary-file'});
    for (const marker of markers) if (data.includes(Buffer.from(marker))) issues.push({file:relative,rule:'private-build-identifier'});
    // Original signed/precompiled upstream binaries can contain their own build paths.
    const upstream = relative.startsWith('Contents/Frameworks/') || relative.includes('/app/node_modules/') || relative.endsWith('/runtime/bin/gh');
    if (data.includes(Buffer.from(personalHome + '/'))) {
      if (upstream) upstreamPaths.push(relative); else issues.push({file:relative,rule:'personal-home-path'});
    }
    if (/\.(?:key|pem|p12|pfx)$/.test(entry.name) && /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(data.toString('utf8'))) issues.push({file:relative,rule:'private-key-file'});
    if (runtime && data.includes(Buffer.from('-----BEGIN')) && /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\r\n]{40,}-----END/.test(data.toString('utf8'))) issues.push({file:relative,rule:'embedded-private-key'});
    // Scan first-party shipped code, avoiding token-shaped encoded vendor data.
    if (/^Contents\/Resources\/app\/(?:desktop|server|dist)\//.test(relative)) {
      const text = data.toString('utf8');
      if (/(?:\bgh[pousr]_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b|\bsk-proj-[A-Za-z0-9_-]{24,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text)) issues.push({file:relative,rule:'credential-format'});
    }
  }
}
await walk(target);
console.log(JSON.stringify({files,bytes,issues,upstreamHomePathFiles:upstreamPaths.length}));
if (issues.length) process.exitCode = 1;
