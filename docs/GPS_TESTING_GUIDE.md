# 📍 GPS Location Testing Guide

## Testing GPS in Expo Go

### Quick Start

1. **Open the Location Test Screen:**
   - Navigate to: `/(tabs)/location-test` in your app
   - Or add a button in Settings/Profile to navigate there

2. **Simulate Location in Expo Go:**
   - **Shake your device** (or press `Cmd+D` / `Ctrl+D` in simulator)
   - Tap **"Configure Location"**
   - Choose one of these options:
     - **"Custom Location"** - Enter coordinates manually
     - **"Apple"** - Apple HQ (37.3349, -122.0090)
     - **"Google"** - Google HQ (37.4220, -122.0841)
     - **"None"** - Use device's actual GPS

### Testing NFT Collection

For testing NFT spawns and collection:

1. **Find NFT spawn coordinates** from your database:
   ```sql
   SELECT latitude, longitude, name FROM nfts LIMIT 10;
   ```

2. **Set custom location** in Expo Go:
   - Use coordinates near your NFT spawn points
   - Example: `48.1486, 17.1077` (Bratislava)

3. **Test collection:**
   - Open Map screen
   - You should see spawns near your simulated location
   - Try collecting NFTs

### Common Test Coordinates

| Location | Latitude | Longitude | Use Case |
|----------|----------|-----------|----------|
| Bratislava | 48.1486 | 17.1077 | Default spawn area |
| Apple HQ | 37.3349 | -122.0090 | Quick test |
| Google HQ | 37.4220 | -122.0841 | Quick test |
| New York | 40.7128 | -74.0060 | Urban testing |
| London | 51.5074 | -0.1278 | International testing |

### Location Test Screen Features

The Location Test Screen (`/(tabs)/location-test`) provides:

- ✅ **Get Current Location** - Fetch GPS coordinates once
- ✅ **Watch Location** - Continuously track location updates
- ✅ **Display Coordinates** - Show lat/lon/accuracy/timestamp
- ✅ **Quick Test Coordinates** - Tap to set test coordinates
- ✅ **Expo Go Instructions** - Built-in guide for location simulation

### Programmatic Testing

You can also test location programmatically:

```typescript
import { getCurrentLocation, watchPosition } from '../lib/location';

// Get location once
const location = await getCurrentLocation();
console.log('Location:', location);

// Watch location updates
const subscription = watchPosition((loc) => {
  console.log('Location update:', loc);
});

// Stop watching
subscription?.remove();
```

### Troubleshooting

#### Location not updating in Expo Go
- Make sure you've configured location in developer menu
- Check that location permissions are granted
- Try shaking device again and re-configuring

#### "Permission denied" error
- Go to device Settings → Privacy → Location Services
- Enable location for Expo Go
- Restart the app

#### Location accuracy is poor
- In Expo Go, simulated locations have perfect accuracy
- Real GPS accuracy depends on device and environment
- Try moving to an open area with clear sky view

### Notes

⚠️ **Important:**
- Location simulation **only works in Expo Go**
- For production builds, you need actual GPS or a development build
- Simulated locations have perfect accuracy (0m)
- Real GPS accuracy is typically 5-50 meters

### Adding Navigation to Test Screen

Add a button in Settings or Profile:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

<TouchableOpacity onPress={() => router.push('/(tabs)/location-test')}>
  <Text>Test GPS Location</Text>
</TouchableOpacity>
```




