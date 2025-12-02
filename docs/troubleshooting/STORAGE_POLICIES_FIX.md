# Storage Policies Fix for Avatar Upload

## Problém

Chyba: `StorageApiError: new row violates row-level security policy` (403)

Toto znamená, že Storage RLS policies blokujú upload avatara.

## Riešenie

Spusti tieto SQL príkazy v Supabase SQL Editori **jeden po druhom**:

### Krok 1: Skontroluj, či bucket existuje

```sql
-- Skontroluj, či bucket 'avatars' existuje
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

Ak bucket neexistuje, vytvor ho:
1. Choď do **Storage** v Supabase Dashboard
2. Klikni **New bucket**
3. Názov: `avatars`
4. Public bucket: **Áno**
5. Klikni **Create bucket**

### Krok 2: Vymaž existujúce policies (ak existujú)

```sql
-- Vymaž existujúce policies pre avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
```

### Krok 3: Pridaj INSERT policy (Upload)

```sql
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Poznámka:** Táto policy kontroluje, či user_id v ceste súboru zodpovedá aktuálnemu používateľovi.

### Krok 4: Pridaj SELECT policy (Read - Public)

```sql
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### Krok 5: Pridaj DELETE policy (Delete own avatars)

```sql
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Krok 6: (Alternatíva) Jednoduchšie policies bez kontroly cesty

Ak vyššie policies nefungujú, skús tieto jednoduchšie (menej bezpečné, ale funkčné):

**Upload policy (jednoduchšia verzia):**
```sql
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

**Read policy (zostáva rovnaká):**
```sql
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Delete policy (jednoduchšia verzia):**
```sql
CREATE POLICY "Allow users to delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

## Overenie

Po spustení policies skontroluj:

```sql
-- Skontroluj policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

## Riešenie problémov

Ak stále nefunguje:

1. **Skontroluj bucket permissions:**
   - Bucket musí byť **public**
   - Alebo musí mať správne policies

2. **Skontroluj file path:**
   - Súbory sa ukladajú ako `avatars/{user_id}-{timestamp}.{ext}`
   - Policies kontrolujú `foldername(name)[1]` čo by malo byť `user_id`

3. **Test upload:**
   - Skús upload cez Supabase Dashboard Storage
   - Ak funguje tam, problém je v policies
   - Ak nefunguje ani tam, problém je v bucket nastavení

## Bezpečnosť

- **Jednoduchšie policies** (alternatíva) umožňujú každému autentifikovanému používateľovi upload/delete v bucket
- **Bezpečnejšie policies** kontrolujú, či používateľ môže upravovať len svoje vlastné súbory
- Pre produkciu odporúčam bezpečnejšie policies, ale pre testovanie môžeš použiť jednoduchšie

