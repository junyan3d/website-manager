import test from 'node:test';
import assert from 'node:assert/strict';
import {enableAvatar, avatarMonogram} from './avatar.js';
import {describeChange} from './change-summary.js';

test('Avatar upgrades the existing badge and preserves surrounding content', () => {
  const before = '<h1>我的内容</h1><div class="monogram">创作</div><p>自定义介绍</p>';
  const after = enableAvatar(before);
  assert.equal(after, '<h1>我的内容</h1>' + avatarMonogram + '<p>自定义介绍</p>');
  assert.equal(enableAvatar(after), after);
});
test('Avatar does not overwrite a customized home badge', () => {
  assert.throws(() => enableAvatar('<div class="monogram">自定义</div>'), /已自定义/);
});
test('Publication comparison shows avatar as an image', () => {
  const change = describeChange('_config.yml', "avatar: ''\n", 'avatar: /assets/images/avatar.webp\n');
  assert.equal(change.rows[0].label, '首页头像');
  assert.equal(change.rows[0].kind, 'image');
});
