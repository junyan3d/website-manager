#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p downloads runtime/bin .build/gh
curl -fL --retry 3 https://cache.ruby-lang.org/pub/ruby/3.3/ruby-3.3.12.tar.gz -o downloads/ruby-3.3.12.tar.gz
curl -fL --retry 3 https://codeload.github.com/openssl/openssl/tar.gz/refs/tags/openssl-3.5.4 -o downloads/openssl-3.5.4.tar.gz
curl -fL --retry 3 https://codeload.github.com/yaml/libyaml/tar.gz/refs/tags/0.2.5 -o downloads/yaml-0.2.5.tar.gz
curl -fL --retry 3 https://www.kernel.org/pub/software/scm/git/git-2.51.1.tar.xz -o downloads/git-2.51.1.tar.xz
curl -fL --retry 3 https://ffmpeg.org/releases/ffmpeg-7.1.tar.xz -o downloads/ffmpeg-7.1.tar.xz
curl -fL --retry 3 https://github.com/cli/cli/releases/download/v2.101.0/gh_2.101.0_macOS_arm64.zip -o downloads/gh.zip
(cd downloads && shasum -a 256 -c ../scripts/sources.sha256)
unzip -q downloads/gh.zip -d .build/gh
cp .build/gh/gh_2.101.0_macOS_arm64/bin/gh runtime/bin/gh
cp /etc/ssl/cert.pem runtime/cert.pem
