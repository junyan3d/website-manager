#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(node -p "require('./package.json').version")
output="release/分享包-$version"
mkdir -p "$output"
cp "release/网站管家-$version-arm64.dmg" "$output/"
python3 scripts/zip-tree.py docs "$output/中文操作说明.zip"
python3 scripts/zip-tree.py 'release/mac-arm64/网站管家.app' "$output/网站管家-$version-AppleSilicon.app.zip"
source_dir=".build/source-attachment"
rm -rf "$source_dir"
mkdir -p "$source_dir/scripts" "$source_dir/template"
/usr/bin/ditto downloads "$source_dir/downloads"
/usr/bin/ditto LICENSES "$source_dir/LICENSES"
for file in sources.sha256 build-runtime.sh build-tools.sh dedupe-runtime.rb install-gems.sh download-runtime.sh prepare-package.mjs rebuild-eventmachine.rb package-policy.mjs zip-tree.py audit-package.mjs; do
  cp "scripts/$file" "$source_dir/scripts/$file"
done
cp template/Gemfile.lock "$source_dir/template/"
cp package.json package-lock.json LICENSE NOTICE "$source_dir/"
cp scripts/third-party-sources.json scripts/collect-third-party-sources.py "$source_dir/scripts/"
cp LICENSES/REBUILDING.md "$source_dir/"
for relative in ruby/include ruby/lib/libruby.3.3-static.a ruby/lib/pkgconfig ffmpeg/include ffmpeg/lib gems/cache gems/ruby/3.3.0/cache ruby/lib/ruby/gems/3.3.0/cache; do
  if [ -e "runtime/$relative" ]; then
    mkdir -p "$source_dir/runtime/$(dirname "$relative")"
    /usr/bin/ditto "runtime/$relative" "$source_dir/runtime/$relative"
  fi
done
python3 scripts/zip-tree.py "$source_dir" "$output/第三方源码与构建材料-$version.zip"
cat > "$output/开始使用.txt" <<EOF
网站管家 $version · Apple Silicon 开源预发布

适用：M 系列 Mac，macOS 14 或更新版本；不支持 Intel、Windows。

安装方式二选一：
1. 打开「网站管家-$version-arm64.dmg」，把「网站管家」拖入「应用程序」。
2. 解压「网站管家-$version-AppleSilicon.app.zip」，把完整的 .app 拖入「应用程序」。
更新旧版前请彻底退出应用，再替换；原网站目录无需重新创建。

首个公开版本继承内部 0.2.5 的功能。
本版包含「检查远端更新 → 对比与冲突处理 → 确认同步到本地」。
同步前保留备份，不会上传；同步后先预览，再单独确认发布。
若版本记录不一致，按界面引导重新授权 GitHub、确认仓库连接、再次检查。
重新授权不会合并提交历史；复查仍不一致时保留内容并停止同步，需先备份再合并历史。
保留中文及空格路径预览修复，不升级内置组件。
本版保留首页头像替换；⌘Q 直接停止后台并退出，未保存的输入会丢失。
双击应用，创建空白网站或打开已有兼容项目。保存只修改本机；发布需在界面单独确认。
运行环境与空白模板已内置，不需要安装 Node、Ruby 或使用命令。
发布仅支持个人 GitHub 账号的「账号.github.io」仓库及 main 分支，使用者登录自己的账号。

图文说明：解压「中文操作说明.zip」，双击 docs 内的「使用说明.html」。
分享时保留完整应用及随附许可证，不附带个人网站、登录资料或私有备份。
为减小应用体积，源码与编译材料移至「第三方源码与构建材料-$version.zip」。
再次分发应用时请一并提供这个附件；运行应用无需安装或解压该附件。

此版未签名、未公证。若 macOS 阻止打开，先确认来源可信，再由使用者自行决定是否通过
系统「隐私与安全性」允许这份测试应用；不要关闭安全保护。本包为首次公开预发布。

测试使用临时项目、模拟 GitHub CLI 与本地 bare 仓库，不连接正式网站。
另一台完全未装开发工具的实体 M 系列 Mac 仍需实际试用；现有自动验收不等于该项完成。
EOF
(cd "$output" && shasum -a 256 "网站管家-$version-arm64.dmg" "网站管家-$version-AppleSilicon.app.zip" 中文操作说明.zip "第三方源码与构建材料-$version.zip" 开始使用.txt > SHA256SUMS.txt)
