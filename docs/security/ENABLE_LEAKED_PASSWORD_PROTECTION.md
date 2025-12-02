# Enable Leaked Password Protection

## Issue
**Warning**: "Leaked Password Protection Disabled" in Supabase Security Advisor

## What is Leaked Password Protection?
This feature checks user passwords against databases of known compromised passwords (like Have I Been Pwned) to prevent users from using weak or leaked passwords.

## How to Enable

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies** (or **Settings**)

### Step 2: Enable Password Protection
1. Look for **"Password Protection"** or **"Leaked Password Protection"** section
2. Toggle it **ON**
3. Save changes

### Alternative: Via Supabase CLI or API
If the option is not visible in the dashboard, you may need to:

1. **Check Auth Settings**:
   - Go to **Authentication** → **Settings**
   - Look for **"Password"** or **"Security"** section
   - Enable **"Check for leaked passwords"** or similar option

2. **Via SQL** (if available):
   ```sql
   -- Note: This may not be available via SQL, check Supabase documentation
   -- Usually enabled via Dashboard or API
   ```

### Step 3: Verify
1. Go back to **Security Advisor**
2. Refresh the security scan
3. The warning should be resolved

## Benefits
- ✅ Prevents users from using compromised passwords
- ✅ Improves overall security
- ✅ Reduces risk of account takeover
- ✅ Follows security best practices

## Notes
- This feature uses external services (like Have I Been Pwned API)
- Passwords are checked using hashed prefixes (secure method)
- No actual passwords are sent to external services
- May slightly increase signup time (negligible)

## Related Settings
While you're in Auth settings, also check:
- ✅ **Email confirmation** (if required)
- ✅ **Password reset** settings
- ✅ **Rate limiting** for auth endpoints
- ✅ **Session timeout** settings

