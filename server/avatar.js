export const avatarMonogram = `<div class="monogram">{% if site.avatar and site.avatar != '' %}<img src="{{ site.avatar | relative_url | escape }}" alt="{{ site.title | escape }}的头像" width="86" height="86" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">{% else %}创作{% endif %}</div>`;

// Upgrade only the known blank-template badge, preserving every other page edit.
export function enableAvatar(html) {
  if (html.includes(avatarMonogram)) return html;
  const original = '<div class="monogram">创作</div>';
  if (!html.includes(original)) throw Error('首页头像区域已自定义，请先检查首页模板；个人资料未保存');
  return html.replace(original, avatarMonogram);
}
