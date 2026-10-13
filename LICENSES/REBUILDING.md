# 对应源码、构建与替换说明

第三方源码附件保存原始源码包，不安装进运行应用。来源、版本和 SHA-256 在 scripts/sources.sha256 与 scripts/third-party-sources.json 中固定。

## 自行构建的运行组件

Apple Silicon Mac 安装 Xcode Command Line Tools 后，按 scripts/download-runtime.sh、build-runtime.sh、build-tools.sh、install-gems.sh 重建。Ruby 3.3.12、OpenSSL 3.5.4、libyaml 0.2.5、Git 2.51.1、FFmpeg 7.1 的版本和参数固定。脚本使用匿名前缀及路径映射；运行入口按自身位置定位。EventMachine 1.2.7 的可选 TLS 修改及 --disable-ssl 编译步骤在 rebuild-eventmachine.rb 中，原始 gem 仍在附件。

FFmpeg 7.1 独立程序使用 LGPL 构建，不启用 GPL/nonfree。源代码和静态库/头文件材料保留，可使用同一脚本重新编译。

## sharp / libvips

npm 锁文件固定 sharp 0.34.5 和 @img/sharp-libvips-darwin-arm64 1.2.4（libvips 8.17.3）。downloads/redistribution 保存官方 sharp 源码、sharp-libvips v1.2.4 打包配方、配方指定的全部依赖源码和外部补丁。原始源码不改动，配方中的 sed/patch 操作是对应修改说明。librsvg 的 Cargo.lock 对应注册表源码另存 rust-crates，使用原校验值。

解压 sharp-libvips-1.2.4.tar.gz，按其 build.sh、platforms/darwin-arm64.sh 和 build/posix.sh 重建；只使用记录的版本和补丁。开发工具 Clang、Meson、CMake、Rust、cargo-c 单独安装。上游配方使用 Rust nightly；本材料不声称逐位复现预编译库。

重建的 libvips-cpp.8.17.3.dylib 可替换 Contents/Resources/app/node_modules/@img/sharp-libvips-darwin-arm64/lib 下对应动态库；sharp 原生绑定源码亦提供。应用不禁止对 LGPL 部分进行修改、替换或为调试这些修改而逆向工程。

## Electron 内置 FFmpeg

Electron 44.7.0 的 DEPS 固定 Chromium 152.0.7977.130 和 Node 24.21.0。附件包含 Electron 源码、patches/ffmpeg 及匹配 Chromium DEPS 的 FFmpeg 修订源码。

按 Electron 官方构建文档初始化固定 DEPS；Chromium FFmpeg 平台配置位于源码 chromium/config，Electron patches/ffmpeg 是额外修改记录。生成的 libffmpeg.dylib 可替换 Electron Framework.framework/Versions/A/Libraries 下同名库。其他公开组件的许可与来源见 Chromium-LICENSES.html。

应用未签名、未公证，不通过签名或私有协议阻止这些组件替换。自行替换之后仍需进行功能和安全检查，不要关闭系统安全保护。
