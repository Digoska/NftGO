# Username Migration Guide

## Prečo potrebuješ migráciu?

Pridali sme podporu pre `username` stĺpec v `users` tabuľke, aby používatelia nemohli používať emaily ako username a mohli si nastaviť vlastné username počas registrácie a v nastaveniach.

## Ako spustiť migráciu

### Krok 1: Otvor Supabase Dashboard

1. Choď na [Supabase Dashboard](https://app.supabase.com)
2. Vyber svoj projekt
3. Choď do **SQL Editor** (v ľavom menu)

### Krok 2: Pridaj username stĺpec

Spusti tento SQL kód:

```sql
-- Pridanie username stĺpca do users tabuľky
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Vytvorenie indexu pre rýchle vyhľadávanie username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### Krok 3: (Voliteľné) Vytvor Supabase Storage bucket pre avatary

Ak chceš podporu pre upload profilových obrázkov:

1. Choď do **Storage** v Supabase Dashboard
2. Klikni na **New bucket**
3. Názov: `avatars`
4. Public bucket: **Áno** (aby boli obrázky verejne dostupné)
5. Klikni **Create bucket**

### Krok 4: (Voliteľné) Nastav Storage policies

Pre bucket `avatars` nastav RLS policies. Spusti každý príkaz **samostatne**:

**Príkaz 1 - Upload policy:**
```sql
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Príkaz 2 - Read policy:**
```sql
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Príkaz 3 - Delete policy:**
```sql
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Dôležité:** Spusti každý `CREATE POLICY` príkaz **samostatne**, nie všetky naraz!

## Overenie

Po spustení migrácie môžeš overiť:

```sql
-- Skontroluj, či je username stĺpec pridaný
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'username';

-- Skontroluj, či existuje index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname = 'idx_users_username';
```

## Poznámky

- **Unikátnosť**: Username musí byť unikátny (UNIQUE constraint)
- **Validácia**: Aplikácia validuje, že username:
  - Nie je email
  - Má 3-20 znakov
  - Obsahuje len písmená, čísla, _ a -
- **Storage**: Ak bucket `avatars` neexistuje, aplikácia bude fungovať bez uploadu obrázkov (používatelia môžu zadať URL)

## Riešenie problémov

Ak sa vyskytnú chyby:

1. **"column already exists"** - Stĺpec už existuje, môžeš ho preskočiť
2. **"duplicate key value"** - Niektorí používatelia už majú username, môžeš ich aktualizovať manuálne
3. **"permission denied"** - Skontroluj, či máš správne oprávnenia v Supabase

