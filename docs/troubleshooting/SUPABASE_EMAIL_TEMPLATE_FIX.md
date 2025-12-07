# Fix Supabase Email Template: Magic Link → OTP Code

## Current Template (Magic Link) ❌

This is what you currently have in Supabase:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ {{ .Token }} }}">Confirm your mail</a></p>
```

**Problem:** `{{ .Token }}` is used in the `<a href>` attribute, which creates a clickable magic link.

---

## Fixed Template (OTP Code) ✅

Replace it with this:

```html
<h2>Confirm your signup</h2>

<p>Your verification code is:</p>

<p><strong style="font-size: 24px; letter-spacing: 4px;">{{ .Token }}</strong></p>

<p>Enter this 8-digit code in the app to complete signup.</p>

<p>This code expires in 1 hour.</p>
```

**Key Change:** `{{ .Token }}` is now displayed as **text** (the code itself), NOT in a link URL.

---

## How to Fix in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **NftGO** project
3. Go to **Authentication** → **Email Templates**
4. Click on **"Magic Link"** template
5. **Replace the entire body** with the fixed template above
6. Update **Subject** to: `Verify your email - {{ .Token }}`
7. Click **Save**

---

## What Changed?

- ❌ **Before:** `<a href="{{ {{ .Token }} }}">` → Creates clickable magic link
- ✅ **After:** `<strong>{{ .Token }}</strong>` → Displays the code as text

Now users will see:
- ✅ **"Your verification code is: 12345678"**
- ❌ **NOT** a clickable link

---

## Test It

1. Save the template in Supabase
2. Try signing up with your email
3. Check your inbox
4. You should see the **8-digit code** displayed, not a link
5. Enter the code in the app ✅

