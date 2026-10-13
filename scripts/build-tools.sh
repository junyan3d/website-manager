#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
TASK_ROOT="$PWD"
export MACOSX_DEPLOYMENT_TARGET=14.0
TASK_MAP="-ffile-prefix-map=$TASK_ROOT=/website-studio-build -fdebug-prefix-map=$TASK_ROOT=/website-studio-build -fmacro-prefix-map=$TASK_ROOT=/website-studio-build"
export SDKROOT="$(xcrun --show-sdk-path)"
mkdir -p runtime/bin logs
cd .build
tar -xf ../downloads/git-2.51.1.tar.xz
cd git-2.51.1
make -j6 prefix=/opt/website-manager/runtime/git NO_GETTEXT=YesPlease NO_TCLTK=YesPlease NO_PERL=YesPlease NO_PYTHON=YesPlease NO_OPENSSL=YesPlease CFLAGS="-O2 -mmacosx-version-min=14.0 $TASK_MAP" > "$TASK_ROOT/logs/git-build.log" 2>&1
make install DESTDIR="$TASK_ROOT/.build/install" prefix=/opt/website-manager/runtime/git NO_GETTEXT=YesPlease NO_TCLTK=YesPlease NO_PERL=YesPlease NO_PYTHON=YesPlease NO_OPENSSL=YesPlease CFLAGS="-O2 -mmacosx-version-min=14.0 $TASK_MAP" > "$TASK_ROOT/logs/git-install.log" 2>&1
/usr/bin/ditto "$TASK_ROOT/.build/install/opt/website-manager/runtime/git" "$TASK_ROOT/runtime/git"
"$TASK_ROOT/runtime/ruby/bin/ruby" "$TASK_ROOT/scripts/dedupe-runtime.rb"
cd ..
tar -xf ../downloads/ffmpeg-7.1.tar.xz
cd ffmpeg-7.1
./configure --prefix=/opt/website-manager/runtime/ffmpeg --disable-autodetect --disable-doc --disable-debug --enable-videotoolbox --enable-audiotoolbox --enable-avfoundation --extra-cflags="-O2 -mmacosx-version-min=14.0 $TASK_MAP" --extra-ldflags='-mmacosx-version-min=14.0' > "$TASK_ROOT/logs/ffmpeg-configure.log" 2>&1
make -j6 > "$TASK_ROOT/logs/ffmpeg-build.log" 2>&1
make install DESTDIR="$TASK_ROOT/.build/install" > "$TASK_ROOT/logs/ffmpeg-install.log" 2>&1
/usr/bin/ditto "$TASK_ROOT/.build/install/opt/website-manager/runtime/ffmpeg" "$TASK_ROOT/runtime/ffmpeg"
