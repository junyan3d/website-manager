#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export CFLAGS="-O2 -ffile-prefix-map=$PWD=/website-studio-build -fdebug-prefix-map=$PWD=/website-studio-build -fmacro-prefix-map=$PWD=/website-studio-build"
export GEM_HOME="$PWD/runtime/gems" GEM_PATH="$PWD/runtime/gems" BUNDLE_PATH="$PWD/runtime/gems" SSL_CERT_FILE="$PWD/runtime/cert.pem"
./runtime/ruby/bin/ruby ./runtime/ruby/bin/gem install bundler -v 2.4.22 --no-document
./runtime/ruby/bin/ruby ./runtime/gems/gems/bundler-2.4.22/exe/bundle install --gemfile template/Gemfile

./runtime/ruby/bin/ruby scripts/rebuild-eventmachine.rb
