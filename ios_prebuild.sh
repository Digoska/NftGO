#!/bin/bash
# Temporary workaround to generate iOS project
cd /Users/digo/Documents/nft-go
npx @expo/cli@latest prebuild --platform ios --skip-dependency-update 2>&1 | tee prebuild.log
if [ -d "ios" ]; then
  echo "iOS project generated successfully!"
  open ios/*.xcworkspace 2>/dev/null || open ios/*.xcodeproj
else
  echo "Failed to generate iOS project. Check prebuild.log"
fi
