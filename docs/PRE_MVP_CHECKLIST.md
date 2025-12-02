# 🚀 Pre-MVP Shipping Checklist

**Status:** Pre-Launch Preparation

This document outlines all critical tasks, security checks, and fixes required before shipping the MVP to production.

---

## 🔒 Security & Authentication

### Database Security (Supabase)

- [ ] **Verify all RLS policies are enabled**
  - [ ] `users` table - RLS enabled
  - [ ] `nfts` table - RLS enabled
  - [ ] `nft_spawns` table - RLS enabled
  - [ ] `user_nfts` table - RLS enabled
  - [ ] `user_stats` table - RLS enabled
  - [ ] `app_updates` table - RLS enabled
  - [ ] `badges` table - RLS enabled
  - [ ] `user_badges` table - RLS enabled

- [ ] **Review and test RLS policies**
  - [ ] Users can only read/update their own profile
  - [ ] Users can only insert/read their own NFTs
  - [ ] Users can only read/update their own stats
  - [ ] NFTs are publicly readable (correct behavior)
  - [ ] Active spawns are publicly readable (correct behavior)
  - [ ] Badges are publicly readable (correct behavior)
  - [ ] App updates are publicly readable (correct behavior)
  - [ ] Only admins can assign badges (verify admin role check)

- [ ] **Test unauthorized access attempts**
  - [ ] Try to access another user's profile data
  - [ ] Try to modify another user's stats
  - [ ] Try to insert NFTs for another user
  - [ ] Verify all attempts are blocked

### API Keys & Environment Variables

- [ ] **Remove hardcoded API keys**
  - [ ] Check `app.config.js` - Google Maps API key placeholder
  - [ ] Ensure all keys are in `.env` file
  - [ ] Verify `.env` is in `.gitignore`

- [ ] **Environment variable security**
  - [ ] Use Supabase Anon Key (not service role key) in client
  - [ ] Verify Supabase URL is correct
  - [ ] Set up production environment variables in Expo/EAS
  - [ ] Never commit `.env` file to Git

- [ ] **Supabase project settings**
  - [ ] Enable email confirmation (if required)
  - [ ] Configure password reset flow
  - [ ] Set up rate limiting
  - [ ] Review OAuth providers (Google, Apple) settings
  - [ ] Verify redirect URLs are correct

### Authentication Security

- [ ] **Password security**
  - [ ] Enforce minimum password length (8+ characters)
  - [ ] Verify password hashing (handled by Supabase)
  - [ ] Test password reset flow

- [ ] **OAuth security**
  - [ ] Verify Google OAuth redirect URIs
  - [ ] Verify Apple Sign In configuration
  - [ ] Test OAuth flows end-to-end
  - [ ] Handle OAuth errors gracefully

- [ ] **Session management**
  - [ ] Verify token refresh works
  - [ ] Test session expiration handling
  - [ ] Verify logout clears all session data

### Storage Security (Supabase Storage)

- [ ] **Storage bucket policies**
  - [ ] `nfts` bucket - public read, authenticated write
  - [ ] `avatars` bucket - public read, authenticated write
  - [ ] Verify file size limits
  - [ ] Verify file type restrictions (images, videos, models)

- [ ] **File upload security**
  - [ ] Validate file types on client
  - [ ] Validate file sizes on client
  - [ ] Sanitize file names
  - [ ] Scan for malicious files (if possible)

### Input Validation & Sanitization

- [ ] **User input validation**
  - [ ] Username validation (length, characters, uniqueness)
  - [ ] Email validation
  - [ ] Profile description length limits
  - [ ] X (Twitter) username format validation

- [ ] **SQL injection prevention**
  - [ ] All queries use parameterized statements (Supabase handles this)
  - [ ] No raw SQL queries in client code
  - [ ] Database functions use parameterized queries

- [ ] **XSS prevention**
  - [ ] Sanitize user-generated content before display
  - [ ] Use React's built-in XSS protection
  - [ ] Review all user input display points

---

## 🐛 Bug Fixes & Critical Issues

### Known Issues

- [ ] **3D Model Loading (GLB with embedded textures)**
  - [ ] Document limitation: GLB with embedded textures don't work in Expo Go
  - [ ] Ensure GLTF with external textures work correctly
  - [ ] Test 3D models in development build
  - [ ] Add user-friendly error messages for unsupported formats

- [ ] **Navigation issues**
  - [ ] Verify back navigation works correctly from all screens
  - [ ] Test deep linking
  - [ ] Verify tab navigation state persistence

- [ ] **Location services**
  - [ ] Test location permissions on iOS
  - [ ] Test location permissions on Android
  - [ ] Handle location permission denial gracefully
  - [ ] Test location accuracy
  - [ ] Test background location (if used)

### Error Handling

- [ ] **Network errors**
  - [ ] Handle offline scenarios
  - [ ] Show user-friendly error messages
  - [ ] Implement retry logic for failed requests
  - [ ] Handle Supabase connection errors

- [ ] **API errors**
  - [ ] Handle 401 (unauthorized) errors
  - [ ] Handle 403 (forbidden) errors
  - [ ] Handle 429 (rate limit) errors
  - [ ] Handle 500 (server) errors

- [ ] **Data validation errors**
  - [ ] Handle missing required fields
  - [ ] Handle invalid data formats
  - [ ] Show validation errors to users

### Edge Cases

- [ ] **Empty states**
  - [ ] Empty NFT collection
  - [ ] Empty leaderboard
  - [ ] No updates/announcements
  - [ ] No badges

- [ ] **Boundary conditions**
  - [ ] Maximum level reached
  - [ ] Maximum experience
  - [ ] Very long usernames/descriptions
  - [ ] Very large NFT collections

---

## ⚡ Performance Optimization

### App Performance

- [ ] **Image optimization**
  - [ ] Use optimized image formats (WebP where possible)
  - [ ] Implement image caching
  - [ ] Lazy load images in collections
  - [ ] Compress images before upload

- [ ] **3D Model optimization**
  - [ ] Optimize GLTF/GLB file sizes
  - [ ] Reduce polygon count where possible
  - [ ] Compress textures
  - [ ] Implement model caching

- [ ] **Database queries**
  - [ ] Review and optimize slow queries
  - [ ] Add missing indexes (check `supabase-schema.sql`)
  - [ ] Implement pagination for large datasets
  - [ ] Use database functions for complex operations

- [ ] **Network optimization**
  - [ ] Implement request batching
  - [ ] Cache frequently accessed data
  - [ ] Reduce API call frequency
  - [ ] Use Supabase Realtime only where needed

### Memory Management

- [ ] **Memory leaks**
  - [ ] Test app for memory leaks (run for extended period)
  - [ ] Clean up event listeners
  - [ ] Dispose of 3D models properly
  - [ ] Clear caches when appropriate

- [ ] **Resource cleanup**
  - [ ] Unmount components properly
  - [ ] Cancel pending requests on unmount
  - [ ] Clear timers/intervals

---

## 🧪 Testing

### Manual Testing

- [ ] **Authentication flows**
  - [ ] Email/password sign up
  - [ ] Email/password sign in
  - [ ] Google OAuth sign in
  - [ ] Apple Sign In
  - [ ] Password reset
  - [ ] Logout

- [ ] **Core features**
  - [ ] View map with NFT spawns
  - [ ] Collect NFT at location
  - [ ] View NFT collection
  - [ ] Filter NFTs by rarity
  - [ ] View NFT details (image, video, 3D model)
  - [ ] View profile
  - [ ] Edit profile
  - [ ] View leaderboard
  - [ ] View updates/announcements

- [ ] **Gamification**
  - [ ] Level up
  - [ ] Gain experience
  - [ ] Daily streak
  - [ ] Coins earned
  - [ ] Badges displayed

- [ ] **Cross-platform**
  - [ ] Test on iOS (physical device)
  - [ ] Test on Android (physical device)
  - [ ] Test on different screen sizes
  - [ ] Test on different OS versions

### Device Testing

- [ ] **iOS devices**
  - [ ] iPhone (latest iOS)
  - [ ] iPad (if supported)
  - [ ] Older iOS versions (if supporting)

- [ ] **Android devices**
  - [ ] Latest Android version
  - [ ] Older Android versions (if supporting)
  - [ ] Different manufacturers (Samsung, Google, etc.)

### Edge Case Testing

- [ ] **Network conditions**
  - [ ] Slow 3G connection
  - [ ] Intermittent connection
  - [ ] No connection (offline mode)
  - [ ] Connection restored after offline

- [ ] **Location scenarios**
  - [ ] Location permission denied
  - [ ] Location services disabled
  - [ ] GPS accuracy issues
  - [ ] Moving between locations

---

## 📱 App Store Preparation

### App Store (iOS)

- [ ] **App Store Connect setup**
  - [ ] Create app listing
  - [ ] Write app description
  - [ ] Prepare screenshots (all required sizes)
  - [ ] Prepare app preview video (optional)
  - [ ] Set up app categories
  - [ ] Set up age rating
  - [ ] Prepare privacy policy URL
  - [ ] Prepare support URL

- [ ] **App metadata**
  - [ ] App name
  - [ ] Subtitle
  - [ ] Keywords
  - [ ] Promotional text
  - [ ] Marketing URL (if applicable)

- [ ] **App icons and assets**
  - [ ] App icon (1024x1024)
  - [ ] All required icon sizes generated
  - [ ] Splash screen configured

- [ ] **Build configuration**
  - [ ] Bundle identifier set (`com.nftgo.app`)
  - [ ] Version number set
  - [ ] Build number set
  - [ ] Signing certificates configured
  - [ ] Provisioning profiles set up

### Google Play Store (Android)

- [ ] **Google Play Console setup**
  - [ ] Create app listing
  - [ ] Write app description
  - [ ] Prepare screenshots (phone, tablet, TV)
  - [ ] Prepare feature graphic
  - [ ] Set up app categories
  - [ ] Set up content rating
  - [ ] Prepare privacy policy URL

- [ ] **App metadata**
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] Graphic assets

- [ ] **Build configuration**
  - [ ] Package name set (`com.nftgo.app`)
  - [ ] Version code set
  - [ ] Version name set
  - [ ] Signing key configured
  - [ ] App signing by Google Play (recommended)

---

## 📄 Legal & Compliance

### Privacy & Terms

- [ ] **Privacy Policy**
  - [ ] Complete and accurate
  - [ ] Covers all data collection
  - [ ] Explains location data usage
  - [ ] Explains third-party services (Supabase, Google, Apple)
  - [ ] Accessible in app
  - [ ] URL set in app stores

- [ ] **Terms of Service**
  - [ ] Complete and accurate
  - [ ] Covers user responsibilities
  - [ ] Covers app usage rules
  - [ ] Accessible in app
  - [ ] URL set in app stores

- [ ] **About page**
  - [ ] App version displayed
  - [ ] Contact information
  - [ ] Credits/attributions

### Data Protection

- [ ] **GDPR compliance** (if applicable)
  - [ ] Data collection consent
  - [ ] Right to access data
  - [ ] Right to delete data
  - [ ] Data export functionality

- [ ] **Location data**
  - [ ] Clear explanation of location usage
  - [ ] User consent for location tracking
  - [ ] Option to disable location (if applicable)

### Third-Party Services

- [ ] **Supabase**
  - [ ] Review Supabase terms of service
  - [ ] Verify data residency requirements
  - [ ] Set up data backup strategy

- [ ] **Google Services**
  - [ ] Google Maps API terms compliance
  - [ ] Google OAuth terms compliance
  - [ ] API key restrictions set

- [ ] **Apple Services**
  - [ ] Apple Sign In terms compliance
  - [ ] App Store guidelines compliance

---

## 🎨 User Experience

### Onboarding

- [ ] **First-time user experience**
  - [ ] Welcome screen
  - [ ] Permission requests explained
  - [ ] Basic tutorial (optional)
  - [ ] Clear call-to-action

### Error Messages

- [ ] **User-friendly error messages**
  - [ ] No technical jargon
  - [ ] Actionable suggestions
  - [ ] Helpful guidance

### Accessibility

- [ ] **Basic accessibility**
  - [ ] Text is readable
  - [ ] Touch targets are adequate size
  - [ ] Color contrast meets WCAG standards
  - [ ] Screen reader support (if possible)

### Localization

- [ ] **Language support**
  - [ ] English (primary)
  - [ ] Slovak (if applicable)
  - [ ] Other languages (if applicable)

---

## 📊 Analytics & Monitoring

### Error Tracking

- [ ] **Set up error tracking**
  - [ ] Sentry or similar service
  - [ ] Crash reporting
  - [ ] Error logging

### Analytics

- [ ] **Set up analytics** (optional)
  - [ ] User events tracking
  - [ ] Screen views
  - [ ] Key user actions

### Performance Monitoring

- [ ] **Monitor app performance**
  - [ ] API response times
  - [ ] App load times
  - [ ] Crash rates

---

## 🚀 Deployment

### Pre-Deployment

- [ ] **Code review**
  - [ ] All code reviewed
  - [ ] No console.logs in production code
  - [ ] No debug code
  - [ ] No test data

- [ ] **Build verification**
  - [ ] Production build tested
  - [ ] All features work in production build
  - [ ] No development-only features enabled

- [ ] **Environment setup**
  - [ ] Production Supabase project configured
  - [ ] Production environment variables set
  - [ ] Production API keys configured

### Deployment Process

- [ ] **iOS deployment**
  - [ ] Build production iOS app
  - [ ] Upload to App Store Connect
  - [ ] Submit for review
  - [ ] Monitor review status

- [ ] **Android deployment**
  - [ ] Build production Android app (AAB format)
  - [ ] Upload to Google Play Console
  - [ ] Submit for review
  - [ ] Monitor review status

### Post-Deployment

- [ ] **Monitor initial launch**
  - [ ] Watch for crashes
  - [ ] Monitor error rates
  - [ ] Check user feedback
  - [ ] Monitor server load

- [ ] **Hotfix process**
  - [ ] Process for urgent fixes
  - [ ] Emergency contact list
  - [ ] Rollback plan

---

## 📝 Documentation

### User Documentation

- [ ] **User guide** (optional)
  - [ ] How to collect NFTs
  - [ ] How to view collection
  - [ ] How to level up
  - [ ] FAQ

### Developer Documentation

- [ ] **README updated**
  - [ ] Installation instructions
  - [ ] Environment setup
  - [ ] Known issues documented

- [ ] **Code documentation**
  - [ ] Key functions documented
  - [ ] Complex logic explained
  - [ ] Architecture overview

---

## ✅ Final Checklist

- [ ] All security checks completed
- [ ] All critical bugs fixed
- [ ] All tests passed
- [ ] App Store listings ready
- [ ] Legal documents complete
- [ ] Production environment configured
- [ ] Monitoring set up
- [ ] Team notified of launch
- [ ] Backup plan ready

---

## 📌 Notes

- **Priority**: Focus on security and critical bugs first
- **Testing**: Test on real devices, not just simulators
- **Backup**: Always have a rollback plan
- **Communication**: Keep team informed of launch status

---

**Last Review Date:** _______________  
**Reviewed By:** _______________  
**Status:** _______________

