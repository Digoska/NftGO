import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationJoystickProps {
  onMove: (latDelta: number, lonDelta: number) => void;
  onToggle: () => void;
  isActive: boolean;
}

export default function LocationJoystick({ onMove, onToggle, isActive }: LocationJoystickProps) {
  const [speed, setSpeed] = useState<'walk' | 'drive'>('walk');
  const pan = useRef(new Animated.ValueXY()).current;

  // Speed multipliers (meters per second)
  const SPEED_MULTIPLIERS = {
    walk: 1.4, // ~5 km/h walking speed
    drive: 13.9, // ~50 km/h driving speed
  };

  // Convert meters to lat/lon delta (approximate)
  const metersToLatLon = (meters: number) => {
    return meters / 111139; // 1 degree ≈ 111.139 km
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limit joystick radius to 50
        const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        const maxRadius = 50;

        if (distance > maxRadius) {
          const angle = Math.atan2(gestureState.dy, gestureState.dx);
          const x = maxRadius * Math.cos(angle);
          const y = maxRadius * Math.sin(angle);
          pan.setValue({ x, y });
        } else {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }

        // Calculate movement delta
        const speedMultiplier = SPEED_MULTIPLIERS[speed];
        const latDelta = -gestureState.dy / 50 * metersToLatLon(speedMultiplier);
        const lonDelta = gestureState.dx / 50 * metersToLatLon(speedMultiplier);

        onMove(latDelta, lonDelta);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const cycleSpeed = () => {
    setSpeed(speed === 'walk' ? 'drive' : 'walk');
  };

  if (!isActive) {
    return (
      <TouchableOpacity style={styles.activateButton} onPress={onToggle}>
        <Ionicons name="navigate" size={24} color="#fff" />
        <Text style={styles.activateText}>DEV MODE</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🕹️ Dev Location</Text>
        <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.speedButton} onPress={cycleSpeed}>
        <Ionicons 
          name={speed === 'walk' ? 'walk' : 'car'} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.speedText}>
          {speed === 'walk' ? '🚶 Walk (5 km/h)' : '🚗 Drive (50 km/h)'}
        </Text>
      </TouchableOpacity>

      <View style={styles.joystickContainer}>
        <View style={styles.joystickBase}>
          <Animated.View
            style={[
              styles.joystickHandle,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
          </Animated.View>
        </View>
      </View>

      <Text style={styles.instructions}>
        Drag to move • Tap speed to switch
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  speedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joystickContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  joystickBase: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickHandle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  instructions: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    textAlign: 'center',
  },
  activateButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  activateText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

