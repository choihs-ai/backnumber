#!/bin/sh
# 사용법: tools/shot.sh 페이지.html 결과.png 가로 세로
cd "$(dirname "$0")/.." || exit 1
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=1 \
  --window-size="${3:-900},${4:-1400}" --virtual-time-budget=3000 \
  --screenshot="$2" "file://$(pwd)/$1" 2>/dev/null
