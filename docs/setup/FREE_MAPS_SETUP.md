# Free Maps Setup Guide

## Good News! 🎉

Your app is already configured to use **FREE maps** on iOS (Apple Maps)!

## Current Setup

### iOS (Apple Maps) - ✅ FREE, No API Key Needed
- Uses native Apple Maps
- **No API key required**
- **No billing required**
- Works out of the box

### Android (Google Maps) - ⚠️ Requires API Key
- Uses Google Maps
- **BUT**: Google gives you **$200/month FREE credit**
- For most small apps, this is more than enough
- You only pay if you exceed $200/month

## Option 1: Use Google Maps Free Tier (Recommended)

Google Maps has a **generous free tier**:
- **$200/month credit** (free)
- Usually enough for thousands of map loads
- Only pay if you exceed the credit

### Setup Steps:

1. **Get Google Maps API Key** (one-time setup):
   - Go to https://console.cloud.google.com/
   - Create project → Enable Maps SDK for Android
   - Create API key
   - **Restrict it** to your Android package: `com.nftgo.app`

2. **Add to `.env`**:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

3. **That's it!** The free tier will cover your usage.

## Option 2: Remove Google Maps (iOS Only)

If you only want to support iOS (no Android), you can remove Google Maps entirely:

1. Remove Google Maps from `app.config.js`
2. iOS will use Apple Maps (free)
3. Android won't have maps (but app will still work)

**Note**: This limits your app to iOS only.

## Option 3: Use OpenStreetMap (Advanced)

For completely free maps on both platforms, you'd need to:
- Use a different library (like `react-native-mapbox-gl` with Mapbox free tier)
- Or use OpenStreetMap with custom setup
- More complex, but completely free

**Recommendation**: Use Option 1 (Google Maps free tier) - it's the easiest and $200/month is usually more than enough.

## Cost Estimate

For a small app with ~1000 active users:
- **Map loads**: ~10,000-50,000/month
- **Cost**: $0 (within free tier)
- **Google Maps pricing**: ~$0.007 per map load
- **Free tier covers**: ~28,000 map loads/month

You'd need **very high usage** to exceed the free tier.

## Current Configuration

Your app is already set up correctly:
- ✅ iOS uses Apple Maps (free)
- ⚠️ Android needs Google Maps API key (but free tier covers it)

Just add the API key to `.env` and you're good to go!

