# 📱 Android & iOS Emulator Commands

## 🤖 Android Emulator

### List Available Emulators
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
emulator -list-avds
```

### Start Specific Emulator
```bash
# Set environment variables (if not already set)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# Start emulator (replace with your AVD name)
emulator -avd Medium_Phone_API_36.1

# Or start in background
emulator -avd Medium_Phone_API_36.1 &
```

### Check Running Emulators
```bash
adb devices
```

### Stop Emulator
```bash
# Find emulator process and kill it
adb emu kill

# Or kill all emulators
pkill -f emulator
```

### Quick Start Script
Create `start-android.sh`:
```bash
#!/bin/bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# List available emulators
echo "Available emulators:"
emulator -list-avds

# Start first available emulator (or specify name)
AVD_NAME=$(emulator -list-avds | head -1)
if [ -z "$AVD_NAME" ]; then
  echo "❌ No emulators found. Create one in Android Studio first."
  exit 1
fi

echo "🚀 Starting $AVD_NAME..."
emulator -avd "$AVD_NAME" &
```

Make it executable:
```bash
chmod +x start-android.sh
./start-android.sh
```

---

## 🍎 iOS Simulator

### List Available Simulators
```bash
xcrun simctl list devices available
```

### List All Simulators (including unavailable)
```bash
xcrun simctl list devices
```

### Open Simulator App
```bash
open -a Simulator
```

### Boot Specific Simulator
```bash
# List devices to get UUID
xcrun simctl list devices

# Boot by device name (e.g., "iPhone 15 Pro")
xcrun simctl boot "iPhone 15 Pro"

# Or boot by UUID
xcrun simctl boot <UUID>
```

### Start Simulator and Boot Device (One Command)
```bash
# Open Simulator and boot iPhone 15 Pro
open -a Simulator && xcrun simctl boot "iPhone 15 Pro"
```

### Shutdown Simulator
```bash
# Shutdown all simulators
xcrun simctl shutdown all

# Shutdown specific device
xcrun simctl shutdown "iPhone 15 Pro"
```

### Quick Start Script
Create `start-ios.sh`:
```bash
#!/bin/bash

# List available devices
echo "Available iOS Simulators:"
xcrun simctl list devices available | grep -E "iPhone|iPad"

# Open Simulator app
open -a Simulator

# Wait a moment for Simulator to open
sleep 2

# Boot iPhone 15 Pro (or change to your preferred device)
DEVICE="iPhone 15 Pro"
echo "🚀 Booting $DEVICE..."
xcrun simctl boot "$DEVICE" 2>/dev/null || echo "Device already booted or not found"
```

Make it executable:
```bash
chmod +x start-ios.sh
./start-ios.sh
```

---

## 🚀 Expo Commands (Automatic)

### Android (Auto-starts emulator if available)
```bash
npx expo run:android
```

### iOS (Auto-starts simulator)
```bash
npx expo run:ios
```

### Start with Specific Device
```bash
# Android - specify device
npx expo run:android --device

# iOS - list available
npx expo run:ios --device

# iOS - specify device
npx expo run:ios --device "iPhone 15 Pro"
```

---

## 🔧 Permanent Environment Setup

### Add to `~/.zshrc` (macOS)
```bash
# Android
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# Reload shell
source ~/.zshrc
```

---

## 📋 Quick Reference

### Android
| Command | Description |
|---------|-------------|
| `emulator -list-avds` | List all emulators |
| `emulator -avd <name>` | Start emulator |
| `adb devices` | List connected devices |
| `adb emu kill` | Stop emulator |

### iOS
| Command | Description |
|---------|-------------|
| `xcrun simctl list devices` | List all simulators |
| `open -a Simulator` | Open Simulator app |
| `xcrun simctl boot <name>` | Boot simulator |
| `xcrun simctl shutdown all` | Shutdown all simulators |

---

## 🎯 Most Common Workflow

### Android
```bash
# 1. Start emulator
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
emulator -avd Medium_Phone_API_36.1 &

# 2. Wait for it to boot (or use: adb wait-for-device)
sleep 30

# 3. Run app
cd /Users/digo/Documents/nft-go
npx expo run:android
```

### iOS
```bash
# 1. Start simulator
open -a Simulator && xcrun simctl boot "iPhone 15 Pro"

# 2. Run app
cd /Users/digo/Documents/nft-go
npx expo run:ios
```

---

**Tip:** Add these to your `package.json` scripts for convenience:
```json
{
  "scripts": {
    "android:emulator": "emulator -avd Medium_Phone_API_36.1 &",
    "ios:simulator": "open -a Simulator && xcrun simctl boot 'iPhone 15 Pro'"
  }
}
```

