# 网站管家

不用写代码，也能创建并维护自己的个人网站。通过中文可视化界面整理文章、作品和个人介绍，先在本地看效果，再确认是否发布。

**v0.1.0 为首个开源预发布，继承内部分享版 0.2.5 的功能。** 支持 M 系列 Mac、macOS 14+；不支持 Intel、Windows。

## 下载与安装

从 [Releases](https://github.com/junyan3d/website-manager/releases) 下载 ARM64 DMG 或应用 ZIP。打开 DMG，将完整的「网站管家.app」拖入「应用程序」；也可解压应用 ZIP 后拖入。升级前彻底退出旧版，已有网站目录无需重新创建。

应用内置运行环境，使用者不需要安装 Node 或 Ruby。此版未签名、未公证；若 macOS 阻止打开，请先确认来源可信，再自行在「隐私与安全性」决定是否允许打开。不要关闭系统安全保护。

保留同一 Release 中的中文说明、第三方源码与构建材料和 SHA256SUMS.txt；源码附件不需要安装或解压即可运行。第三方源码中的公开测试证书或测试密钥不是用户凭据，不进入运行应用。

## 当前功能

- 创建匿名空白网站、打开兼容项目、继续最近项目或切换项目。
- 编辑文章、作品、分类、个人资料、页面封面与社交链接；替换首页头像。
- 导入并优化图片与视频，保留原件；作品素材支持排序与说明。
- 本地保存和预览、自动备份、回收区恢复及恢复冲突比较。
- 使用自己的 GitHub 账号确认目标仓库、比较并选择修改后发布；确认前不上传内容。
- 检查远端更新、同步可快进的版本、处理文件内容冲突；提供重新授权与仓库连接确认引导。
- ⌘Q 直接停止后台并退出，尚未保存的输入会丢失。

[中文图文操作说明](docs/使用说明.html)

## 使用边界

仅支持本模板或兼容数据结构，不能自动转换任意 Jekyll 网站。发布仅支持个人账号的 `账号.github.io` 仓库及 main 分支，不支持组织网站或任意项目子路径。

保存只修改本机，发布需单独确认。提交历史分叉、已暂存文件、账号或仓库不一致时停止自动同步或发布；重新授权不会合并提交历史。不要用强制推送覆盖未知远端更新。

后台只监听 localhost。登录由官方 GitHub CLI 与 macOS 钥匙串管理；应用不接受或打包 Token，拒绝 CLI 明文凭据回退文件。私有状态、备份、回收内容与原件存放在应用用户数据目录，不随应用或网站发布。

尚未在第二台完全未装开发工具的实体 Mac 验证。自动验收使用非 UTF-8 环境、受限 PATH、中文及空格路径、移动后的应用、模拟 GitHub CLI 与本地 bare 仓库，不连接正式网站。

## 开发与构建

制作应用需要 Apple Silicon Mac、Xcode Command Line Tools 和 Node 22+。版本固定在 package-lock.json、template/Gemfile.lock 与源码校验清单中；使用 npm ci，不任意更新内置组件。

```sh
npm ci
node node_modules/electron/install.js
bash scripts/download-runtime.sh
bash scripts/build-runtime.sh
bash scripts/build-tools.sh
bash scripts/install-gems.sh
npm test
npm run build
npm run acceptance
npm run dist
python3 scripts/collect-third-party-sources.py
bash scripts/package-extras.sh
```

只有源码检查时无需完整运行环境：执行 `TEST_GIT=/usr/bin/git npm test` 和 `npm run build`。系统 Git 仅供单元测试，应用使用内置 Git。

公开 CI 运行源码测试和前端构建。安装包在独立私有构建仓库完成构建与包内验收，再由维护者明确授权发布；不会自动向用户网站部署或公开新版本。

node_modules/、runtime/、downloads/、.build/、logs/、release/ 和用户资料不进入源码仓库。运行包仅包含生产依赖；完整对应源码与构建材料在 Release 附件中。

## 许可证与素材来源

应用自有代码采用 [Apache-2.0](LICENSE)，署名和改动说明见 [NOTICE](NOTICE)。主题改编自 Hux Blog（Apache-2.0），保留 Clean Blog、Bootstrap、normalize.css 的 MIT 许可及 JetBrains Mono 的 OFL 许可；其他组件遵循原许可，详见 [第三方说明](LICENSES/THIRD-PARTY.md)。

匿名模板的封面与应用图标为本项目生成素材；文档截图使用匿名示例，不包含原作者作品、经历、个人账号或私有资料。

软件按现状提供。欢迎在 Issues 报告问题，请仅提供脱敏描述，不上传 Token、验证码或私人备份。
