import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Location as LocationType } from '../types';

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    // Request foreground permissions first
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return false;
    }

    // Only request background permissions if foreground is granted
    // Background permissions might not be available in Expo Go
    try {
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status === 'granted') {
        return true;
      }
      // If background is denied but foreground is granted, that's okay
      return true;
    } catch (bgError) {
      // Background permissions might not be available (e.g., in Expo Go)
      return true; // Foreground permission is enough for basic functionality
    }
  } catch (error: any) {
    console.error('Error requesting location permissions:', error);
    
    // If error is about missing Info.plist keys, provide helpful message
    if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
      console.error('❌ Location permissions not configured in Info.plist');
      console.error('💡 Solution: Rebuild the app in Xcode or use development build');
      console.error('💡 Expo Go has limited location support');
    }
    
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationType | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export function watchPosition(
  callback: (location: LocationType) => void
): Location.LocationSubscription | null {
  let subscription: Location.LocationSubscription | null = null;

  requestLocationPermissions().then((hasPermission) => {
    if (!hasPermission) {
      return null;
    }

    subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        });
      }
    );
  });

  return subscription;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number
): boolean {
  return calculateDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
}

/**
 * Calculates the bearing angle from one point to another
 * @param lat1 Starting latitude
 * @param lon1 Starting longitude
 * @param lat2 Target latitude
 * @param lon2 Target longitude
 * @returns Bearing in degrees (0-360), where 0° = North, 90° = East, 180° = South, 270° = West
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees and normalize to 0-360

  return bearing;
}

export function generateRandomPoint(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  targetSector?: { sectorIndex: number; sectorSize: number }
): { latitude: number; longitude: number } {
  // Convert radius from meters to degrees (approximate)
  // 1 degree latitude is approx 111,320 meters
  const r = radiusMeters / 111320;
  
  const u = Math.random();
  let t: number;
  
  if (targetSector !== undefined) {
    // Generate angle within the specified sector
    const sectorStartAngle = targetSector.sectorIndex * targetSector.sectorSize;
    const sectorEndAngle = sectorStartAngle + targetSector.sectorSize;
    // Convert to radians and generate random angle within sector
    const sectorStartRad = (sectorStartAngle * Math.PI) / 180;
    const sectorEndRad = (sectorEndAngle * Math.PI) / 180;
    t = sectorStartRad + Math.random() * (sectorEndRad - sectorStartRad);
  } else {
    // Random angle 0-360° (existing behavior)
    const v = Math.random();
    t = 2 * Math.PI * v;
  }
  
  // Use square root of u to ensure uniform distribution within circle
  const w = r * Math.sqrt(u);
  
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Adjust longitude for latitude
  const xAdjusted = x / Math.cos(centerLat * (Math.PI / 180));
  
  return {
    latitude: centerLat + y,
    longitude: centerLon + xAdjusted,
  };
}

