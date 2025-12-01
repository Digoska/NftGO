# 📱 Android Build Guide - Step by Step

> **Kompletný návod na zostavenie NftGO aplikácie pre Android**

---

## 📋 Predpoklady

### 1. Potrebné nástroje

- ✅ **Node.js** (v18 alebo novší) - [Download](https://nodejs.org/)
- ✅ **npm** alebo **yarn** (prichádza s Node.js)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **Android Studio** - [Download](https://developer.android.com/studio)
- ✅ **Java Development Kit (JDK)** 17 - [Download](https://www.oracle.com/java/technologies/downloads/#java17)

### 2. Android Studio Setup

1. **Stiahnuť a nainštalovať Android Studio**
   - [Download Android Studio](https://developer.android.com/studio)
   - Nainštaluj a spusti setup wizard

2. **Nainštalovať Android SDK**
   - Android Studio → **More Actions** → **SDK Manager**
   - V **SDK Platforms** tab:
     - ✅ **Android 14.0 (API 34)** alebo novší
     - ✅ **Android 13.0 (API 33)**
   - V **SDK Tools** tab:
     - ✅ **Android SDK Build-Tools**
     - ✅ **Android SDK Command-line Tools**
     - ✅ **Android SDK Platform-Tools**
     - ✅ **Android Emulator**
     - ✅ **Google Play services**
   - Klikni **Apply** a počkaj na inštaláciu

3. **Nastaviť Environment Variables**

   **Windows:**
   ```powershell
   # Pridaj do System Environment Variables:
   ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
   PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
   ```

   **macOS/Linux:**
   ```bash
   # Pridaj do ~/.zshrc alebo ~/.bashrc:
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
   
   # Reload shell:
   source ~/.zshrc  # alebo source ~/.bashrc
   ```

   **Overenie:**
   ```bash
   echo $ANDROID_HOME  # macOS/Linux
   echo %ANDROID_HOME% # Windows
   ```

---

## 🚀 Krok 1: Klonovanie Repozitára

```bash
# Klonuj repo
git clone https://github.com/Digoska/NftGO.git

# Choď do adresára
cd NftGO
```

---

## 📦 Krok 2: Inštalácia Závislostí

```bash
# Inštaluj Node.js dependencies
npm install

# Alebo ak používaš yarn:
yarn install
```

**Poznámka:** Ak máš problémy s peer dependencies, skús:
```bash
npm install --legacy-peer-deps
```

---

## 🔐 Krok 3: Environment Variables

### 1. Vytvor `.env` súbor

V root adresári projektu vytvor súbor `.env`:

```bash
# V root adresári (NftGO/)
touch .env
```

### 2. Pridaj Supabase credentials

Otvor `.env` a pridaj:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Kde získaš credentials:**
1. Choď na [Supabase Dashboard](https://app.supabase.com)
2. Vyber projekt (alebo vytvor nový)
3. **Settings** → **API**
4. Skopíruj:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ Dôležité:** `.env` sa **NEUPLOADNE** na Git (je v `.gitignore`). Musíš ho vytvoriť manuálne!

---

## 🗄️ Krok 4: Supabase Setup

### 1. Vytvor Supabase Projekt

1. Choď na [Supabase](https://supabase.com)
2. **New Project**
3. Vyplň:
   - **Name:** `nft-go` (alebo čokoľvek)
   - **Database Password:** (ulož si ho!)
   - **Region:** vyber najbližší
4. Klikni **Create new project**
5. Počkaj ~2 minúty na vytvorenie

### 2. Spusti Database Schema

1. V Supabase Dashboard → **SQL Editor**
2. Otvor súbor `supabase-schema.sql` z projektu
3. **Skopíruj celý obsah** a vlož do SQL Editor
4. Klikni **Run** (alebo F5)

**⚠️ Dôležité:** Ak sa zobrazí chyba, skús spustiť SQL príkazy **po jednom** (nie celý súbor naraz).

### 3. Vytvor Storage Buckets

1. V Supabase Dashboard → **Storage**
2. Klikni **New bucket**
3. Vytvor bucket:
   - **Name:** `nfts`
   - **Public bucket:** ✅ **ON**
   - Klikni **Create bucket**
4. Vytvor druhý bucket:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **ON**
   - Klikni **Create bucket**

### 4. Nastav Storage Policies (Voliteľné)

Ak chceš, aby používatelia mohli uploadovať NFT/avatary:

1. **Storage** → **Policies**
2. Pre každý bucket vytvor policy:
   - **Policy name:** `Public read access`
   - **Allowed operation:** `SELECT`
   - **Policy definition:** `true`
   - Klikni **Review** → **Save policy**

---

## 📱 Krok 5: Android Build

### Možnosť 1: Expo Development Build (Odporúčané)

```bash
# 1. Prebuild Android projekt
npx expo prebuild --platform android --clean

# 2. Otvor projekt v Android Studio
# Android Studio → Open → vyber android/ adresár

# 3. V Android Studio:
# - File → Sync Project with Gradle Files
# - Počkaj na synchronizáciu

# 4. Spusti build
npx expo run:android

# Alebo v Android Studio:
# Run → Run 'app' (alebo Shift+F10)
```

### Možnosť 2: Expo Go (Rýchle testovanie)

```bash
# 1. Spusti Expo dev server
npm start

# 2. Naskenuj QR kód v Expo Go app (Android)
# - Stiahni Expo Go z Google Play
# - Otvor Expo Go
# - Naskenuj QR kód
```

**⚠️ Obmedzenia Expo Go:**
- ❌ GLB embedded textúry nefungujú
- ⚠️ Maps majú obmedzenú funkcionalitu
- ✅ GLTF s externými textúrami fungujú

### Možnosť 3: EAS Build (Cloud Build)

```bash
# 1. Inštaluj EAS CLI
npm install -g eas-cli

# 2. Login do Expo
eas login

# 3. Konfiguruj projekt
eas build:configure

# 4. Build pre Android
eas build --platform android

# 5. Stiahni APK/AAB z Expo dashboard
```

---

## 🔧 Krok 6: Riešenie Problémov

### Problém 1: `ANDROID_HOME is not set`

**Riešenie:**
```bash
# macOS/Linux - pridaj do ~/.zshrc alebo ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# Windows - pridaj do System Environment Variables:
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

### Problém 2: `Gradle sync failed`

**Riešenie:**
```bash
# V android/ adresári:
cd android
./gradlew clean
cd ..
```

### Problém 3: `SDK location not found`

**Riešenie:**
1. Android Studio → **File** → **Project Structure**
2. **SDK Location** → nastav cestu k Android SDK
3. Zvyčajne: `~/Library/Android/sdk` (macOS) alebo `C:\Users\...\AppData\Local\Android\Sdk` (Windows)

### Problém 4: `Metro bundler error`

**Riešenie:**
```bash
# Vyčisti cache
npm start -- --reset-cache

# Alebo:
rm -rf node_modules
npm install
```

### Problém 5: `Build failed: Out of memory`

**Riešenie:**
1. V `android/gradle.properties` pridaj:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

### Problém 6: `Execution failed for task ':app:mergeDebugResources'`

**Riešenie:**
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npx expo prebuild --clean --platform android
```

---

## ✅ Krok 7: Overenie Buildu

### 1. Spusti aplikáciu

```bash
# Spusti na pripojenom zariadení alebo emulátore
npx expo run:android
```

### 2. Skontroluj logy

```bash
# Android logcat
adb logcat | grep -i "expo\|react\|error"
```

### 3. Test funkcií

- ✅ Login/Signup
- ✅ Home screen (stats, leaderboard)
- ✅ NFT collection
- ✅ 3D modely (ak máš GLTF NFT)

---

## 📦 Krok 8: Vytvorenie Release APK/AAB

### 1. Nastav signing key

```bash
# Vytvor keystore (len raz!)
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore nftgo-release-key.keystore -alias nftgo-key -keyalg RSA -keysize 2048 -validity 10000

# Ulož si:
# - Keystore password
# - Key alias: nftgo-key
# - Key password
```

### 2. Konfiguruj signing

V `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('nftgo-release-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'nftgo-key'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### 3. Build release APK

```bash
cd android
./gradlew assembleRelease

# APK bude v: android/app/build/outputs/apk/release/app-release.apk
```

### 4. Build release AAB (pre Google Play)

```bash
cd android
./gradlew bundleRelease

# AAB bude v: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🎯 Quick Checklist

- [ ] Node.js nainštalovaný
- [ ] Android Studio nainštalovaný
- [ ] Android SDK nainštalovaný
- [ ] `ANDROID_HOME` nastavený
- [ ] Repo sklonovaný
- [ ] `npm install` úspešný
- [ ] `.env` súbor vytvorený s Supabase credentials
- [ ] Supabase projekt vytvorený
- [ ] Database schema spustený
- [ ] Storage buckets vytvorené
- [ ] `npx expo prebuild --platform android` úspešný
- [ ] Build úspešný
- [ ] Aplikácia beží na zariadení/emulátore

---

## 📚 Ďalšie Zdroje

- [Expo Android Guide](https://docs.expo.dev/build/android/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🆘 Potrebuješ Pomoc?

Ak máš problémy:
1. Skontroluj logy: `adb logcat`
2. Pozri `README.md` pre všeobecné informácie
3. Pozri `CONTRIBUTING.md` pre development guidelines
4. Vytvor [GitHub Issue](https://github.com/Digoska/NftGO/issues)

---

**Vytvorené:** 2025-01-29  
**Pre:** Android Build  
**Verzia:** 1.0

