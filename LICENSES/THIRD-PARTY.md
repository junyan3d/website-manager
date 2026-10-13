# 第三方软件与源码

本安装包为未签名测试包，包含以下独立运行环境；不是任何第三方的官方产品；应用自有代码采用 Apache-2.0，第三方保留各自许可。

| 组件 | 版本 | 许可证 / 来源 |
| --- | --- | --- |
| Electron / Chromium / Node | 44.7.0 / 随 Electron | MIT、BSD 等，Electron-MIT.txt 与 Chromium-LICENSES.html；https://github.com/electron/electron/releases/tag/v44.7.0 |
| Ruby | 3.3.12 | Ruby/BSD，Ruby.txt；随包源码附件 `downloads/ruby-3.3.12.tar.gz` |
| OpenSSL | 3.5.4 | Apache 2.0，OpenSSL.txt；随包源码附件 |
| libyaml | 0.2.5 | MIT，libyaml.txt；随包源码附件 |
| Git | 2.51.1 | GPLv2，Git-GPL-2.0.txt；随包附件完整源码；构建脚本公开于该份源代码包 |
| GitHub CLI | 2.101.0 | MIT，GitHub-CLI-MIT.txt；https://github.com/cli/cli/tree/v2.101.0 |
| FFmpeg | 7.1 | LGPLv2.1+，FFmpeg-LGPL-2.1.txt；随包附件完整源码；没有启用 GPL/nonfree；使用 VideoToolbox |
| sharp / libvips | 见 package-lock.json 与 native package versions.json | Apache 2.0 / LGPLv3 等，应用依赖目录含 notices；源码：https://github.com/lovell/sharp 与 https://github.com/lovell/sharp-libvips |
| Jekyll 与 Ruby gems | template/Gemfile.lock | 各 gem 自带 LICENSE；gem 源码仍在 runtime/gems 中，安装缓存另存随包源码附件 |
| React / Tiptap / Express 等 | package-lock.json | 许可证随应用 LICENSES/npm 及运行依赖保留 |
| Hux Blog 主题 | 原主题适配 | Apache 2.0，Hux-Blog-Apache-2.0.txt；https://github.com/Huxpro/huxpro.github.io |

为精简安装体积，完整源码与构建材料另存为同目录的「第三方源码与构建材料-0.1.0.zip」，分享应用时一并提供。此附件不需要安装或解压即可使用应用；附件提供实际构建使用的 Ruby、OpenSSL、libyaml、Git 与 FFmpeg 源码归档、gem 缓存及编译静态库；`scripts/sources.sha256` 固定校验值，`scripts/build-runtime.sh` 和 `scripts/build-tools.sh` 给出编译参数。FFmpeg 为默认 LGPL 构建，不使用 libx264。应用保留 Ruby gem 的运行库、扩展与许可证，gem 安装缓存放在附件中。动态 libvips 可替换，应用不禁止用户为调试其修改而逆向工程 LGPL 部分。

sharp-libvips 所依赖软件及许可证列表也在 `sharp-libvips-README.md` 中，确切版本见 `sharp-libvips-versions.json`。构建源码可从上述版本化仓库和包中链接获取。本预发布的二进制和对应源码材料在同一 GitHub Release 中公开提供。

EventMachine 保持 1.2.7，按 scripts/rebuild-eventmachine.rb 加入可选 TLS 构建开关，分享包使用 --disable-ssl，避免编入上游默认示例私钥。网站管家只使用本地 HTTP 及事件循环；Ruby OpenSSL、Git/GitHub CLI 的 HTTPS 功能保留。原始 gem 源码与重建脚本随源码附件提供。

公开分发材料还包含 sharp 0.34.5、sharp-libvips 1.2.4 的完整官方构建配方、当前 libvips 8.17.3 及其依赖的对应源码/补丁、Electron 44.7.0 的源码/补丁与其 Chromium 152.0.7977.130 对应 FFmpeg 源码。来源和 SHA-256 见 scripts/third-party-sources.json；重建与替换说明见 LICENSES/REBUILDING.md。上游源码中的公开测试证书与密钥作为原始材料保留，不安装到运行应用。
