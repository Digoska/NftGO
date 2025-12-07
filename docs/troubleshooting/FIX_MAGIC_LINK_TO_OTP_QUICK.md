# 🚨 Quick Fix: Magic Link → OTP Code

## Problem
You're receiving a **magic link** email instead of an **OTP code** when signing up.

## Quick Fix (5 minutes)

### 1. Go to Supabase Dashboard
- Open: https://app.supabase.com
- Select your **NftGO** project

### 2. Update Email Template
1. Go to: **Authentication** → **Email Templates**
2. Click on **"Magic Link"** template
3. Change the template to show OTP code instead:

**Subject:**
```
Verify your email - {{ .Token }}
```

**Body (HTML):**
```html
<h2>Confirm your signup</h2>

<p>Your verification code is:</p>

<p><strong style="font-size: 24px; letter-spacing: 4px;">{{ .Token }}</strong></p>

<p>Enter this 8-digit code in the app to complete signup.</p>

<p>This code expires in 1 hour.</p>

<p>If you didn't request this code, please ignore this email.</p>
```

**Important:** 
- ❌ **Don't** use `{{ .Token }}` in `<a href>` (that creates a magic link)
- ✅ **Do** display `{{ .Token }}` as plain text or styled text (that's the OTP code)

4. Click **Save**

### 3. Alternative: Use OTP Template
If there's a separate **"OTP"** template:
1. Make sure it's the one being used for signup
2. Verify it contains `{{ .Token }}` (not a link)
3. Save it

### 4. Test
1. Try signing up with your email
2. Check your inbox
3. You should see: **"Your verification code is: 12345678"**
4. Enter the code in the app ✅

## What Changed in Code
Nothing! The code was already correct. The issue was just Supabase configuration.

## Still Getting Magic Links?
1. Check **Authentication** → **Settings** → **Email Auth**
2. Make sure **"Enable email confirmations"** is ON
3. Check **Logs** → **Auth Logs** to see what's being sent
4. Try a different email provider (Gmail, Outlook, etc.)

