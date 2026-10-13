#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
TASK_ROOT="$PWD"
TASK_DEPS="$TASK_ROOT/.build/deps"
export MACOSX_DEPLOYMENT_TARGET=14.0
TASK_MAP="-ffile-prefix-map=$TASK_ROOT=/website-studio-build -fdebug-prefix-map=$TASK_ROOT=/website-studio-build -fmacro-prefix-map=$TASK_ROOT=/website-studio-build"
export SDKROOT="$(xcrun --show-sdk-path)"
mkdir -p "$TASK_DEPS/lib" "$TASK_DEPS/include" runtime/bin .build logs
cd .build
tar -xf ../downloads/yaml-0.2.5.tar.gz
cd libyaml-0.2.5
mkdir -p objects
for file in src/*.c; do clang $TASK_MAP -O2 -fPIC -mmacosx-version-min=14.0 -Iinclude -Isrc -DYAML_VERSION_MAJOR=0 -DYAML_VERSION_MINOR=2 -DYAML_VERSION_PATCH=5 '-DYAML_VERSION_STRING="0.2.5"' -c "$file" -o "objects/$(basename "$file" .c).o"; done
ar rcs "$TASK_DEPS/lib/libyaml.a" objects/*.o
cp include/yaml.h "$TASK_DEPS/include/"
cd ..
tar -xf ../downloads/openssl-3.5.4.tar.gz
cd openssl-openssl-3.5.4
perl Configure darwin64-arm64-cc no-shared no-tests --prefix="$TASK_DEPS" --openssldir=/etc/ssl $TASK_MAP -mmacosx-version-min=14.0 > "$TASK_ROOT/logs/openssl-configure.log" 2>&1
make -j6 > "$TASK_ROOT/logs/openssl-build.log" 2>&1
make install_sw > "$TASK_ROOT/logs/openssl-install.log" 2>&1
cd ..
tar -xf ../downloads/ruby-3.3.12.tar.gz
cd ruby-3.3.12
./configure --prefix=/opt/website-manager/runtime/ruby --enable-load-relative --disable-shared --disable-install-doc --disable-yjit --disable-dtrace --without-gmp --with-openssl-dir="$TASK_DEPS" --with-libyaml-dir="$TASK_DEPS" --with-out-ext=readline CFLAGS="-O2 -mmacosx-version-min=14.0 $TASK_MAP" debugflags= > "$TASK_ROOT/logs/ruby-configure.log" 2>&1
make -j6 > "$TASK_ROOT/logs/ruby-build.log" 2>&1
make install DESTDIR="$TASK_ROOT/.build/install" > "$TASK_ROOT/logs/ruby-install.log" 2>&1
/usr/bin/ditto "$TASK_ROOT/.build/install/opt/website-manager/runtime/ruby" "$TASK_ROOT/runtime/ruby"
"$TASK_ROOT/runtime/ruby/bin/ruby" -ropenssl -rpsych -e 'puts RUBY_VERSION; puts OpenSSL::OPENSSL_VERSION; puts Psych::LIBYAML_VERSION'
