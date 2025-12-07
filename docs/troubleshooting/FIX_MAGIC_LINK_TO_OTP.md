# Fix: Magic Link Instead of OTP Code

## Problem
When signing up, users receive a **magic link email** instead of an **OTP verification code**. The app expects an 8-digit code but receives a link instead.

## Root Cause
Supabase email templates are configured to send **magic links** by default instead of **OTP codes**. This is a Supabase dashboard configuration issue.

## Solution

### Step 1: Update Supabase Email Template (REQUIRED)

1. **Go to Supabase Dashboard**
   - Open [Supabase Dashboard](https://app.supabase.com)
   - Select your **NftGO** project

2. **Navigate to Email Templates**
   - Go to **Authentication** → **Email Templates**
   - Find the **"Magic Link"** template
   - Click on it to edit

3. **Create/Update OTP Template**
   - Look for **"OTP"** template OR create a custom one
   - If OTP template doesn't exist, you can:
     - Use the "Magic Link" template as a base
     - OR configure Supabase to send OTP codes instead

4. **Configure Email Provider Settings**
   - Go to **Authentication** → **Settings**
   - Under **Email Auth**, check:
     - **Enable email confirmations** - Should be ON
     - **Secure email change** - Optional
   
5. **Update Email Template Content**
   - The OTP email should contain a **6-8 digit code**
   - Should NOT contain a clickable link for login
   - Display `{{ .Token }}` as **text** (the code), NOT in `<a href>` (that's a magic link)
   - Example template (HTML):
     ```html
     <h2>Confirm your signup</h2>
     
     <p>Your verification code is:</p>
     
     <p><strong style="font-size: 24px; letter-spacing: 4px;">{{ .Token }}</strong></p>
     
     <p>Enter this 8-digit code in the app to complete signup.</p>
     
     <p>This code expires in 1 hour.</p>
     
     <p>If you didn't request this code, please ignore this email.</p>
     ```
   
   **Key Difference:**
   - ❌ **Magic Link** (WRONG): `<a href="{{ {{ .Token }} }}">Confirm your mail</a>`
   - ✅ **OTP Code** (CORRECT): `<strong>{{ .Token }}</strong>` or just `{{ .Token }}`

### Step 2: Configure Supabase to Send OTP Codes

**Option A: Disable Magic Links (Recommended)**

1. Go to **Authentication** → **URL Configuration**
2. Make sure **Site URL** is set (can be placeholder for mobile)
3. **Important:** Do NOT set `emailRedirectTo` in code (already done ✅)

**Option B: Use Custom Email Template**

1. Go to **Authentication** → **Email Templates**
2. Create a new template called **"OTP"** with:
   ```
   Subject: Verify your email - {{ .Token }}
   
   Body (HTML):
   <h2>Confirm your signup</h2>
   
   <p>Your verification code is:</p>
   
   <p><strong style="font-size: 24px; letter-spacing: 4px;">{{ .Token }}</strong></p>
   
   <p>Enter this 8-digit code in the app to complete signup.</p>
   
   <p>Code expires in 1 hour.</p>
   
   <p>If you didn't request this, ignore this email.</p>
   ```
   
   **Critical:** Make sure `{{ .Token }}` is displayed as **text**, NOT used in an `<a href>` link!

### Step 3: Verify Code is Using OTP

The code already calls `signInWithOtp()` which should send OTP codes. Make sure:

1. ✅ No `emailRedirectTo` option is set (already correct)
2. ✅ Using `signInWithOtp()` method (already correct)
3. ⚠️ **Email template in Supabase must be configured for OTP**

## Current Code Status

The app code is correct:
- ✅ Uses `signInWithOtp()` method
- ✅ No `emailRedirectTo` option (which would force magic links)
- ✅ Expects 8-digit code input
- ⚠️ **Only issue: Supabase email template configuration**

## Quick Fix in Supabase Dashboard

1. Go to **Authentication** → **Email Templates**
2. Find **"Magic Link"** template (this is what's being used)
3. **Change it from:**
   ```html
   <a href="{{ {{ .Token }} }}">Confirm your mail</a>
   ```
   
   **To:**
   ```html
   <strong>{{ .Token }}</strong>
   ```
   
4. Full template example:
   ```html
   <h2>Confirm your signup</h2>
   
   <p>Your verification code is:</p>
   
   <p><strong style="font-size: 24px; letter-spacing: 4px;">{{ .Token }}</strong></p>
   
   <p>Enter this 8-digit code in the app.</p>
   ```
   
   **Key:** `{{ .Token }}` should be **displayed as text** (the code), NOT used in a link URL!

## Testing

After updating Supabase configuration:

1. Try signing up with a test email
2. Check email - should contain a **6-8 digit code**
3. Should NOT contain a "Log In" link
4. Enter code in app - should work!

## Alternative: Use Magic Link Flow

If you prefer magic links:

1. Update app to handle magic link clicks
2. Use deep linking to open app from email
3. Handle authentication via URL tokens

But since the UI is already set up for OTP codes, **fixing the email template is better**.

## Still Not Working?

1. **Check Supabase Logs**
   - Dashboard → **Logs** → **Auth Logs**
   - See what email was actually sent

2. **Verify Email Template**
   - Authentication → Email Templates
   - Make sure OTP template exists and is active

3. **Check Email Provider**
   - If using custom SMTP, verify configuration
   - Default Supabase emails should work

4. **Test with Different Email**
   - Some email providers might format emails differently
   - Try Gmail, Outlook, etc.

