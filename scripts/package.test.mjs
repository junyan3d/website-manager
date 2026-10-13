import {test} from 'node:test';
import assert from 'node:assert/strict';
import {excludeRuntime} from './package-policy.mjs';
test('Runtime cleanup removes installed gem tests and build records without removing runtime libraries or generator templates', () => {
  for (const file of ['gems/ruby/3.3.0/gems/eventmachine-1.2.7/tests/client.key', 'gems/ruby/3.3.0/gems/ffi-1.16.3/ext/ffi_c/Makefile', 'ruby/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/test/example.rb', 'gems/ruby/3.3.0/extensions/arm64-darwin-24/3.3.0-static/ffi-1.16.3/mkmf.log', 'ruby/include/ruby.h']) assert.equal(excludeRuntime(file), true, file);
  for (const file of ['gems/gems/bundler-2.4.22/lib/bundler/templates/newgem/test/minitest/test_helper.rb.tt', 'gems/ruby/3.3.0/gems/ffi-1.16.3/lib/ffi_c.bundle', 'gems/ruby/3.3.0/extensions/arm64-darwin-24/3.3.0-static/ffi-1.16.3/ffi_c.bundle', 'gems/ruby/3.3.0/gems/jekyll-3.9.5/LICENSE', 'ruby/lib/ruby/3.3.0/openssl.rb', 'git/libexec/git-core/git-http-backend']) assert.equal(excludeRuntime(file), false, file);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
test('Package audit accepts relocated relative links and rejects private-key bytes embedded in native artifacts without echoing them', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'manager-package-audit-'));
  try {
    const app = path.join(temporary, '中文 应用.app');
    const lib = path.join(app, 'Contents/Resources/runtime/lib');
    await fs.mkdir(lib, {recursive:true});
    await fs.writeFile(path.join(lib, 'native.bundle'), 'fixture binary');
    await fs.symlink('native.bundle', path.join(lib, 'alias.bundle'));
    const alias = path.join(temporary, '入口 别名.app');
    await fs.symlink(app, alias);
    const audit = () => spawnSync(process.execPath, [path.join(import.meta.dirname, 'audit-package.mjs'), alias], {encoding:'utf8',env:{...process.env,PRIVATE_BUILD_REPO:''}});
    let result = audit(); assert.equal(result.status, 0, result.stdout + result.stderr);
    const fake = '-----BEGIN RSA PRIVATE KEY-----\n' + 'A'.repeat(64) + '\n-----END RSA PRIVATE KEY-----';
    await fs.writeFile(path.join(lib, 'native.bundle'), 'fixture binary\0' + fake);
    result = audit(); assert.equal(result.status, 1);
    assert.ok(JSON.parse(result.stdout).issues.some(x => x.rule === 'embedded-private-key'));
    assert.ok(!result.stdout.includes(fake));
  } finally {await fs.rm(temporary, {recursive:true,force:true});}
});
