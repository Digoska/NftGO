import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Location as LocationType } from '../types';

export async function requestLocationPermissions(): Promise<boolean> {
  console.log('🔍 LOCATION: requestLocationPermissions() called');
  try {
    console.log('🔍 LOCATION: About to request foreground permissions...');
    // Request foreground permissions first
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('🔍 LOCATION: Foreground permission status:', status);
    
    if (status !== 'granted') {
      console.log('🔍 LOCATION: Foreground permission denied, returning false');
      return false;
    }

    console.log('🔍 LOCATION: Foreground permission granted, requesting background permissions...');
    // Only request background permissions if foreground is granted
    // Background permissions might not be available in Expo Go
    try {
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      console.log('🔍 LOCATION: Background permission status:', backgroundStatus.status);
      if (backgroundStatus.status === 'granted') {
        console.log('🔍 LOCATION: Background permission granted, returning true');
        return true;
      }
      // If background is denied but foreground is granted, that's okay
      console.log('🔍 LOCATION: Background permission denied but foreground granted, returning true');
      return true;
    } catch (bgError) {
      console.log('🔍 LOCATION: Background permission request error (expected in Expo Go):', bgError);
      // Background permissions might not be available (e.g., in Expo Go)
      console.log('🔍 LOCATION: Background permission unavailable, returning true (foreground is enough)');
      return true; // Foreground permission is enough for basic functionality
    }
  } catch (error: any) {
    console.error('🔍 LOCATION: Error requesting location permissions:', error);
    
    // If error is about missing Info.plist keys, provide helpful message
    if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
      console.error('❌ Location permissions not configured in Info.plist');
      console.error('💡 Solution: Rebuild the app in Xcode or use development build');
      console.error('💡 Expo Go has limited location support');
    }
    
    console.log('🔍 LOCATION: Returning false due to error');
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationType | null> {
  console.log('🔍 LOCATION: getCurrentLocation() called');
  try {
    console.log('🔍 LOCATION: Checking permissions...');
    const hasPermission = await requestLocationPermissions();
    console.log('🔍 LOCATION: Permission check result:', hasPermission);
    if (!hasPermission) {
      console.log('🔍 LOCATION: No permission, returning null');
      return null;
    }

    console.log('🔍 LOCATION: Permission granted, getting current position...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    console.log('🔍 LOCATION: Current position retrieved:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
    console.log('🔍 LOCATION: Returning location object:', result);
    return result;
  } catch (error) {
    console.error('🔍 LOCATION: Error getting current location:', error);
    console.log('🔍 LOCATION: Returning null due to error');
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

