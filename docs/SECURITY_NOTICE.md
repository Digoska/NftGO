# Security Notice

## Exposed Credentials

The `.env.backup` file was accidentally committed to git and contains Supabase credentials.

**What was exposed:**
- Supabase project URL
- Supabase anon key (public key)

**Status:**
- ✅ Files removed from git tracking
- ✅ Updated .gitignore to prevent future commits
- ⚠️ **Keys still in git history** - consider rotating them

## What to Do

### 1. Rotate Supabase Keys (Recommended)

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

