# ⚡ Quick Start Guide

## Pre Kamaráta v Cursor AI

### 🎯 Čo je tento projekt?

**NftGO** - Location-based NFT collection app (ako Pokémon GO, ale pre NFT).

### 🚀 Rýchly Setup

```bash
# 1. Klonuj a inštaluj
git clone <repo>
cd nft-go
npm install

# 2. Vytvor .env
echo "EXPO_PUBLIC_SUPABASE_URL=..." > .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=..." >> .env

# 3. Spusti
npm start
```

### ⚠️ Aktuálny Problém

**GLB modely s embedded textúrami nefungujú v Expo Go.**

**Riešenie:** Použi **GLTF s externými textúrami** (funguje vždy).

**Pozri:** `GLTF_UPLOAD_GUIDE.md` pre detailný návod.

### 📝 Kľúčové Súbory

- `README.md` - Kompletný popis projektu
- `CONTRIBUTING.md` - Pre vývojárov
- `.cursorrules` - Cursor AI kontext

### 🔗 Dôležité Linky

- `GLB_TEXTURE_PROBLEM_DETAILED.md` - Detailný popis problému
- `GLTF_UPLOAD_GUIDE.md` - Ako uploadovať GLTF modely
- `supabase-schema.sql` - Databázová schéma

---

**Všetko je v README.md!** 📖

