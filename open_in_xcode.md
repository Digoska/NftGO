# Ako otvoriť projekt v Xcode

Kvôli známemu bugu v Expo CLI SDK 54 (`_internal.projectRoot`), máte tieto možnosti:

## Možnosť 1: Použite Expo Go (najrýchlejšie)

```bash
npx expo start
```

Potom naskenujte QR kód v Expo Go aplikácii na vašom iPhone.

## Možnosť 2: EAS Build (odporúčané pre produkciu)

```bash
# 1. Prihláste sa do EAS
eas login

# 2. Vytvorte build
eas build --platform ios --local --profile preview
```

Toto automaticky vygeneruje iOS projekt a otvorí ho v Xcode.

## Možnosť 3: Manuálne vytvorenie iOS projektu

Ak Expo CLI nefunguje, môžete vytvoriť iOS projekt manuálne:

1. Vytvorte nový Expo projekt s iOS podporou:
```bash
cd /tmp
npx create-expo-app@latest temp-ios --template blank-typescript
cd temp-ios
npx expo prebuild --platform ios
```

2. Skopírujte `ios` priečinok do vášho projektu:
```bash
cp -r /tmp/temp-ios/ios /Users/digo/Documents/nft-go/
```

3. Otvorte v Xcode:
```bash
open /Users/digo/Documents/nft-go/ios/*.xcworkspace
```

## Možnosť 4: Použite Expo Development Build

```bash
npx expo install expo-dev-client
npx expo run:ios
```

**Poznámka:** Bug `_internal.projectRoot` je známy problém v Expo CLI SDK 54. Expo tím na tom pracuje.

