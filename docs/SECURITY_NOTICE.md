# Security Notice

## Exposed Credentials

### 1. Supabase Credentials (FIXED)
The `.env.backup` file was accidentally committed to git and contains Supabase credentials.

### 2. Google Maps API Key (FIXED) ⚠️ URGENT
The Google Maps API key was hardcoded in `android/app/src/main/AndroidManifest.xml` and exposed on GitHub.

**What was exposed:**
- Supabase project URL
- Supabase anon key (public key)
- **Google Maps API key: `REDACTED_GOOGLE_MAPS_KEY`** (for project nftgo-480915)

**Status:**
- ✅ Files removed from git tracking
- ✅ **API key removed from all git history**
- ✅ Updated .gitignore to prevent future commits
- ⚠️ **Keys still need to be rotated/revoked in Google Cloud Console**

## What to Do

### 1. Revoke Google Maps API Key (URGENT - Do This First!)

The exposed Google Maps API key must be revoked immediately:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **NftGO (nftgo-480915)**
3. Go to **APIs & Services** → **Credentials**
4. Find the API key: `REDACTED_GOOGLE_MAPS_KEY`
5. Click on it → **Delete** or **Restrict** it
6. Create a new API key
7. Add the new key to your `.env` file as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
8. Restrict the new key to:
   - Android package: `com.nftgo.app`
   - Only enable: Maps SDK for Android

**The old key is now removed from git history, but you still need to revoke it in Google Cloud Console!**

### 2. Rotate Supabase Keys (Recommended)

Even though it's the anon key (public), it's good practice to rotate it:

1. Go to Supabase Dashboard → Settings → API
2. Generate new anon key
3. Update your `.env` file with the new key
4. Update any deployed apps

### 2. Check for Other Exposed Secrets

Make sure no other sensitive files are in the repo:
- `.env` files
- `client_secret_*.json` files
- API keys
- Private keys

### 3. Remove from Git History (Optional)

If you want to completely remove the files from git history, you can use:

```bash
# WARNING: This rewrites git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.backup ios/.xcode.env" \
  --prune-empty --tag-name-filter cat -- --all
```

Or use BFG Repo-Cleaner (easier):
```bash
bfg --delete-files .env.backup
bfg --delete-files ios/.xcode.env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Note:** This rewrites history and requires force push. Only do this if you're the only one working on the repo.

## Current Protection

The `.gitignore` now includes:
- `.env*` (all env file variations)
- `*secret*`
- `*key*.json`
- `*credential*`
- Other sensitive patterns

## Prevention

Before committing, always check:
```bash
git status
git diff
```

Make sure no `.env` or secret files are listed.

