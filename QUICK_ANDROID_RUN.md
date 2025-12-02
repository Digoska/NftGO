# 🚀 Quick Android Run Guide

## ✅ Čo je hotové

- ✅ Android SDK nainštalovaný
- ✅ Prebuild úspešný (`android/` adresár vytvorený)
- ✅ Dependencies nainštalované
- ✅ `.env` súbor nastavený

## 📱 Potrebuješ Android zariadenie alebo emulátor

### Možnosť 1: Spustiť Android Emulator

1. **Otvori Android Studio**
   ```bash
   open -a "Android Studio"
   ```

2. **Vytvor/Spusti Emulator:**
   - Android Studio → **More Actions** → **Virtual Device Manager**
   - Klikni **Create Device** (alebo vyber existujúci)
   - Vyber zariadenie (napr. Pixel 5)
   - Vyber systémový obrázok (napr. Android 13 - API 33)
   - Klikni **Finish**
   - Klikni **▶️ Play** na spustenie emulátora

3. **Počkaj na spustenie emulátora** (~30 sekúnd)

4. **Spusti build:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
   npx expo run:android
   ```

### Možnosť 2: Pripojiť fyzické zariadenie

1. **Na Android telefóne:**
   - **Settings** → **About phone**
   - Klikni 7x na **Build number** (aktivuje Developer options)
   - **Settings** → **Developer options**
   - Zapni **USB debugging**

2. **Pripoj telefón cez USB**

3. **Overenie:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   adb devices
   ```
   
   Mala by sa zobraziť tvoja zariadenie.

4. **Spusti build:**
   ```bash
   npx expo run:android
   ```

### Možnosť 3: Expo Go (Rýchle testovanie)

Ak nechceš čakať na build, môžeš použiť Expo Go:

```bash
# Spusti dev server
npm start

# Naskenuj QR kód v Expo Go app (Android)
# - Stiahni Expo Go z Google Play
# - Otvor Expo Go
# - Naskenuj QR kód
```

**⚠️ Poznámka:** Expo Go má obmedzenia (GLB embedded textúry nefungujú).

---

## 🔧 Nastavenie ANDROID_HOME permanentne

Aby si nemusel exportovať ANDROID_HOME zakaždým:

```bash
# Pridaj do ~/.zshrc
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools' >> ~/.zshrc

# Reload shell
source ~/.zshrc
```

---

## ✅ Keď máš zariadenie/emulátor pripojený

```bash
# Spusti build
cd /Users/digo/Documents/nft-go
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
npx expo run:android
```

Build môže trvať 5-10 minút pri prvom spustení.

---

## 🐛 Problémy?

### Emulator sa nespustí
- Skontroluj, či máš nainštalovaný **Android Emulator** v SDK Manager
- Skús reštartovať Android Studio

### `adb devices` neukazuje zariadenie
- Skontroluj USB kábel
- Skontroluj, či je **USB debugging** zapnutý
- Skús `adb kill-server && adb start-server`

### Build zlyháva
- Skontroluj logy: `adb logcat`
- Skús: `cd android && ./gradlew clean && cd .. && npx expo run:android`

---

**Hotovo!** Keď máš zariadenie/emulátor pripojený, spusti `npx expo run:android` 🚀

