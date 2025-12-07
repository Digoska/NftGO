# 📋 App Store Policy Compliance Checklist

## Current Status: ✅ Policies Exist In-App

Your app already has:
- ✅ Privacy Policy (in-app screens)
- ✅ Terms of Service (in-app screens)
- ✅ Location permission descriptions
- ✅ Age restriction (13+)

## ⚠️ Required for App Store Submission

### **CRITICAL: Privacy Policy URL Required**

Both Apple App Store and Google Play Store **REQUIRE** a publicly accessible URL to your Privacy Policy. Currently, you only have in-app screens.

**Action Required:**
1. Host Privacy Policy on a website (GitHub Pages, your domain, etc.)
2. Host Terms of Service on a website
3. Add URLs to:
   - App Store Connect (iOS)
   - Google Play Console (Android)
   - In-app screens (link to web version)

---

## 🍎 Apple App Store Requirements (2024-2025)

### 1. Privacy Policy URL (REQUIRED)
- ✅ Must be publicly accessible (not just in-app)
- ✅ Must be linked in App Store Connect
- ✅ Must be accessible without downloading the app

### 2. Privacy Nutrition Labels / App Privacy
In App Store Connect, you must declare:

#### Data Collection:
- ✅ **Location Data** - Required for app functionality
  - Purpose: App Functionality
  - Linked to User: Yes
  - Used for Tracking: No
  - Collected: Yes

- ✅ **Contact Info** (Email, Name)
  - Purpose: App Functionality, Analytics
  - Linked to User: Yes
  - Used for Tracking: No
  - Collected: Yes

- ✅ **User Content** (Profile photos, NFT collection data)
  - Purpose: App Functionality
  - Linked to User: Yes
  - Used for Tracking: No
  - Collected: Yes

- ✅ **Identifiers** (User ID, Device ID)
  - Purpose: App Functionality, Analytics
  - Linked to User: Yes
  - Used for Tracking: No
  - Collected: Yes

#### Third-Party Data Sharing:
- ⚠️ **Supabase** - Backend services
- ⚠️ **Google** - OAuth authentication, Maps (Android)
- ⚠️ **Apple** - Sign In with Apple
- ⚠️ **OpenStreetMap** - Map tiles (no data shared)

### 3. Age Rating
- ✅ Current: 13+ (mentioned in Privacy Policy)
- ⚠️ **Action:** Set age rating in App Store Connect to match

### 4. Location Services Disclosure
- ✅ Permission strings are set in `Info.plist`
- ✅ Privacy Policy explains location usage
- ✅ Terms mention location requirements

### 5. Support URL (REQUIRED)
- ⚠️ **Missing:** Need a support contact URL or email
- Current contact: `privacy@nftgo.app` and `legal@nftgo.app`

---

## 🤖 Google Play Store Requirements (2024-2025)

### 1. Privacy Policy URL (REQUIRED)
- ✅ Must be publicly accessible
- ✅ Must be linked in Play Console
- ✅ Must be accessible without downloading the app

### 2. Data Safety Section
In Google Play Console, you must declare:

#### Data Collected:
- ✅ **Location** (Approximate, Precise)
  - Purpose: App functionality
  - Optional: No (required for core feature)
  
- ✅ **Personal info** (Email, Name)
  - Purpose: Account management
  - Optional: No

- ✅ **Photos and videos** (Profile photos, NFT media)
  - Purpose: App functionality
  - Optional: Yes (profile photo)

- ✅ **App activity** (NFT collection data, game stats)
  - Purpose: App functionality
  - Optional: No

#### Data Shared:
- ⚠️ **Supabase** - Backend infrastructure
- ⚠️ **Google** - Authentication, Maps
- ⚠️ **OpenStreetMap** - Map display (no data shared)

### 3. Content Rating
- ⚠️ **Action:** Complete content rating questionnaire
- Age range: Likely "Everyone" or "Teen"

### 4. Target API Level
- ⚠️ **Check:** Ensure app targets Android 14 (API 34) minimum
- ⚠️ **New requirement:** Must target API 35 by August 2025

### 5. Permissions Declaration
- ✅ Location permissions declared in `app.config.js`
- ✅ Permission descriptions are clear

---

## 📝 Privacy Policy Updates Needed

### Current Issues:
1. ❌ No web URL (only in-app)
2. ⚠️ Last updated date is "November 2024" (should be current)
3. ⚠️ Contact emails might not be set up (`privacy@nftgo.app`)

### Recommended Additions:

#### 1. Add Data Retention Details
Current policy mentions "30 days after account deletion" - good! But add:
- How long location data is retained (currently says "not stored long-term" - clarify)
- How long analytics data is retained

#### 2. Add GDPR Rights (if applicable)
If you have EU users, explicitly mention:
- Right to data portability
- Right to object to processing
- Right to lodge complaint with supervisory authority

#### 3. Add California Privacy Rights (if applicable)
If you have California users:
- CCPA/CPRA compliance statement
- Opt-out of sale of personal information (if applicable)

#### 4. Clarify Data Storage Location
- Where is Supabase data stored? (US, EU, etc.)
- Data residency information

---

## 🔒 Terms of Service Updates Needed

### Current Issues:
1. ❌ No web URL (only in-app)
2. ⚠️ Last updated date is "November 2024" (should be current)
3. ⚠️ Contact email might not be set up (`legal@nftgo.app`)

### Recommended Additions:

#### 1. Add Refund Policy
If app is free: Mention it's free
If you plan to add in-app purchases: Add refund policy

#### 2. Add Dispute Resolution
- How disputes are resolved
- Jurisdiction information

#### 3. Add NFT Disclaimer
- Clarify NFTs are in-app digital collectibles
- Not blockchain-based NFTs (if that's the case)
- No real-world value (if applicable)

---

## ✅ Action Items Checklist

### Immediate (Before App Store Submission):

- [ ] **Create web-hosted Privacy Policy**
  - [ ] Host on GitHub Pages, your domain, or similar
  - [ ] Update last modified date to current date
  - [ ] Verify contact emails work

- [ ] **Create web-hosted Terms of Service**
  - [ ] Host on same domain/subdomain
  - [ ] Update last modified date to current date

- [ ] **Add URLs to App Store Connect (iOS)**
  - [ ] Privacy Policy URL
  - [ ] Terms of Service URL
  - [ ] Support URL or email

- [ ] **Add URLs to Google Play Console (Android)**
  - [ ] Privacy Policy URL
  - [ ] Terms of Service URL (optional but recommended)
  - [ ] Support URL or email

- [ ] **Complete Privacy Nutrition Labels (iOS)**
  - [ ] Declare all data collection
  - [ ] Declare all third-party sharing
  - [ ] Set age rating

- [ ] **Complete Data Safety Section (Android)**
  - [ ] Declare all data collection
  - [ ] Declare all data sharing
  - [ ] Complete content rating questionnaire

- [ ] **Update In-App Policy Screens**
  - [ ] Add links to web versions of policies
  - [ ] Update "Last Updated" dates
  - [ ] Verify contact emails

### Recommended (For Better Compliance):

- [ ] **Add GDPR Compliance Section** (if EU users)
- [ ] **Add CCPA/CPRA Section** (if California users)
- [ ] **Clarify Data Retention Periods** in Privacy Policy
- [ ] **Add Data Storage Location** information
- [ ] **Set up email addresses** (privacy@nftgo.app, legal@nftgo.app)
- [ ] **Create Support Page** with FAQ and contact info
- [ ] **Add Cookie Policy** (if you have a website)
- [ ] **Add Data Deletion Instructions** in Privacy Policy

---

## 🔗 Required URLs Structure

Recommended structure:

```
https://nftgo.app/privacy-policy (or your domain)
https://nftgo.app/terms-of-service
https://nftgo.app/support (or contact@nftgo.app)
```

Or if using GitHub Pages:
```
https://digoska.github.io/nftgo/privacy-policy
https://digoska.github.io/nftgo/terms-of-service
```

---

## 📅 Current Policy Status

**Privacy Policy:**
- ✅ Covers location data ✅
- ✅ Covers account information ✅
- ✅ Covers third-party services ✅
- ✅ Covers user rights ✅
- ✅ Age restriction mentioned (13+) ✅
- ❌ No web URL ❌
- ⚠️ Last updated: November 2024 (needs update) ⚠️

**Terms of Service:**
- ✅ Covers account responsibilities ✅
- ✅ Covers NFT collection rules ✅
- ✅ Covers location services ✅
- ✅ Covers user conduct ✅
- ✅ Age restriction (13+) ✅
- ❌ No web URL ❌
- ⚠️ Last updated: November 2024 (needs update) ⚠️

---

## 🚨 Critical Missing Items

1. **Privacy Policy Web URL** - REQUIRED by both stores
2. **Support Contact** - REQUIRED by both stores
3. **Privacy Nutrition Labels (iOS)** - Must complete in App Store Connect
4. **Data Safety Section (Android)** - Must complete in Play Console

---

## 💡 Next Steps

1. **Host Policies Online:**
   - Create simple HTML versions of policies
   - Host on GitHub Pages or your domain
   - Get public URLs

2. **Update App Store Listings:**
   - Add URLs to App Store Connect
   - Complete privacy declarations
   - Set age rating

3. **Update In-App:**
   - Link to web versions
   - Update dates
   - Verify contact info

Want me to help create the web-hosted versions of your policies?


