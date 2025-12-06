# Debug Profile Update Issue

## Problem
Profile fields (username, full_name, avatar_url, description, x_username) are all NULL in database, even though profile record exists.

## Possible Causes

### 1. RLS (Row Level Security) Blocking Updates
**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check update policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%update%';
```

**Fix:** Policy should be:
```sql
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 2. App Not Authenticated Properly
The update uses `user.id` from auth context. If `auth.uid()` doesn't match `user.id`, RLS will block the update.

**Check in app:**
- Console logs when saving profile
- Check if `updateError` is logged
- Verify `user?.id` matches database user ID

### 3. Silent Failures
The app catches errors but might not show them properly.

**Check in app code:**
```typescript
if (updateError) {
  console.error('Error updating profile:', updateError);
  Alert.alert('Error', updateError.message || 'Failed to save profile');
}
```

### 4. Storage Bucket Issue (for avatar)
Avatar upload might fail silently.

**Check:**
- `avatars` bucket exists
- Bucket is public
- User has upload permissions

## Quick Fix: Manual Update via SQL

Run this in Supabase SQL Editor (as postgres role):

```sql
UPDATE users
SET 
  username = 'your_username',
  full_name = 'Your Full Name',
  description = 'Your bio',
  x_username = 'your_x_handle',
  updated_at = NOW()
WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863';
```

## Test App Update Flow

1. Open app → Edit Profile
2. Fill in all fields
3. Check browser console (if using web) or React Native debugger
4. Look for:
   - `Error updating profile:` logs
   - Network requests to Supabase
   - RLS policy errors

## Verify After Fix

```sql
SELECT 
  username,
  full_name,
  avatar_url,
  description,
  x_username
FROM users
WHERE id = '908149f0-85fe-4351-893f-464e3dc5d863';
```

All fields should be populated, not NULL.

