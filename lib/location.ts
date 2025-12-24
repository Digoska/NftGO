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

/**
 * Location history entry for movement validation
 */
export interface LocationHistory {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

/**
 * LocationValidator class to detect GPS spoofing and unrealistic movement
 * Tracks user movement history and validates if new locations are realistic
 */
export class LocationValidator {
  private locationHistory: LocationHistory[] = [];
  private readonly MAX_HISTORY = 10;
  private readonly MAX_SPEED_KMH = 50; // Max realistic speed (city speed limit, walking/biking/slow driving)
  private readonly MIN_ACCURACY_METERS = 100; // GPS accuracy threshold

  /**
   * Add location to history for movement tracking
   */
  addLocation(lat: number, lon: number, accuracy?: number): void {
    const now = Date.now();
    
    // Add to history
    this.locationHistory.push({
      latitude: lat,
      longitude: lon,
      timestamp: now,
      accuracy,
    });
    
    // Keep only last MAX_HISTORY locations
    if (this.locationHistory.length > this.MAX_HISTORY) {
      this.locationHistory.shift();
    }
    
    console.log(`📍 LocationValidator: Added location (${lat.toFixed(6)}, ${lon.toFixed(6)}), history size: ${this.locationHistory.length}`);
  }

  /**
   * Validate if movement to new location is realistic
   * Returns validation result with reason if invalid
   */
  isValidMovement(newLat: number, newLon: number): { valid: boolean; reason?: string; calculatedSpeed?: number } {
    if (this.locationHistory.length === 0) {
      // No history yet, allow first location
      return { valid: true };
    }
    
    const lastLocation = this.locationHistory[this.locationHistory.length - 1];
    const now = Date.now();
    const timeDiffSeconds = (now - lastLocation.timestamp) / 1000;
    
    // Need at least 1 second between locations for speed calculation
    if (timeDiffSeconds < 1) {
      return { valid: true }; // Too fast to calculate, allow it
    }
    
    // Calculate distance in meters
    const distanceMeters = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      newLat,
      newLon
    );
    
    // Calculate speed in km/h
    const speedKmh = (distanceMeters / 1000) / (timeDiffSeconds / 3600);
    
    console.log(`🚗 Movement validation: Distance: ${Math.round(distanceMeters)}m, Time: ${timeDiffSeconds.toFixed(1)}s, Speed: ${speedKmh.toFixed(1)} km/h`);
    
    // Check if speed exceeds maximum realistic speed
    if (speedKmh > this.MAX_SPEED_KMH) {
      return {
        valid: false,
        reason: `Movement too fast (${speedKmh.toFixed(1)} km/h). Possible GPS spoofing detected.`,
        calculatedSpeed: speedKmh,
      };
    }
    
    // Check accuracy if available
    if (lastLocation.accuracy && lastLocation.accuracy > this.MIN_ACCURACY_METERS) {
      console.log(`⚠️ LocationValidator: Low GPS accuracy (${Math.round(lastLocation.accuracy)}m)`);
      // Don't reject, but log warning
    }
    
    return { valid: true, calculatedSpeed: speedKmh };
  }

  /**
   * Detect teleportation (impossible distance in time period)
   * More strict check than isValidMovement
   */
  detectTeleport(newLat: number, newLon: number): boolean {
    if (this.locationHistory.length === 0) {
      return false;
    }
    
    const lastLocation = this.locationHistory[this.locationHistory.length - 1];
    const now = Date.now();
    const timeDiffSeconds = (now - lastLocation.timestamp) / 1000;
    
    // If less than 5 seconds, check for very large distances
    if (timeDiffSeconds < 5) {
      const distanceMeters = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLat,
        newLon
      );
      
      // If moved more than 1km in less than 5 seconds, it's likely teleportation
      if (distanceMeters > 1000) {
        console.log(`🚨 Teleportation detected: ${Math.round(distanceMeters)}m in ${timeDiffSeconds.toFixed(1)}s`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get average movement speed over last N locations
   */
  getAverageSpeed(): number {
    if (this.locationHistory.length < 2) {
      return 0;
    }
    
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      
      const distance = calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      
      if (timeDiff > 0) {
        totalDistance += distance;
        totalTime += timeDiff;
      }
    }
    
    if (totalTime === 0) {
      return 0;
    }
    
    // Convert to km/h
    return (totalDistance / 1000) / (totalTime / 3600);
  }

  /**
   * Clear history (for testing or reset)
   */
  clearHistory(): void {
    this.locationHistory = [];
    console.log('📍 LocationValidator: History cleared');
  }
}

// Export singleton instance
export const locationValidator = new LocationValidator();

