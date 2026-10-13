// Scope cleanup to installed gems, not tool-generated templates inside lib/.
export function excludeRuntime(relative) {
  const fixed = ['ruby/include', 'ruby/lib/libruby.3.3-static.a', 'ruby/lib/pkgconfig',
    'ffmpeg/include', 'ffmpeg/lib', 'ffmpeg/bin/ffprobe', 'gems/cache',
    'gems/ruby/3.3.0/cache', 'ruby/lib/ruby/gems/3.3.0/cache'];
  if (fixed.some(p => relative === p || relative.startsWith(p + '/'))) return true;
  const name = relative.split('/').at(-1);
  if (['.DS_Store', '.eslintcache', 'mkmf.log', 'gem_make.out'].includes(name)) return true;
  if (/^(?:gems\/(?:ruby\/3\.3\.0\/)?gems|ruby\/lib\/ruby\/gems\/3\.3\.0\/gems)\/[^/]+\/(?:test|tests|spec|specs|ext|\.git|\.github)(?:\/|$)/.test(relative)) return true;
  return false;
}
