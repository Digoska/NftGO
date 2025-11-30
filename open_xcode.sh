#!/bin/bash
cd /Users/digo/Documents/nft-go

# Try to generate iOS project using expo start
echo "Spúšťam Expo server..."
npx expo start --ios --no-dev --minify 2>&1 | grep -i "xcode\|workspace\|project" || echo "Čakám na generovanie projektu..."

# Wait a bit and check for iOS folder
sleep 10

if [ -d "ios" ]; then
  if [ -f "ios/*.xcworkspace" ]; then
    open ios/*.xcworkspace
  elif [ -f "ios/*.xcodeproj" ]; then
    open ios/*.xcodeproj
  else
    echo "iOS priečinok existuje, ale nenašiel som workspace/project súbor"
    ls -la ios/
  fi
else
  echo "iOS priečinok ešte neexistuje. Skúste:"
  echo "1. npx expo start --ios (a počkajte na generovanie)"
  echo "2. Alebo manuálne: npx expo prebuild --platform ios"
fi
