import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface FireAnimationProps {
  visible: boolean;
  duration?: number;
}

export default function FireAnimation({ visible, duration = 1000 }: FireAnimationProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const particle1Anim = useRef(new Animated.Value(0)).current;
  const particle2Anim = useRef(new Animated.Value(0)).current;
  const particle3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);
      particle1Anim.setValue(0);
      particle2Anim.setValue(0);
      particle3Anim.setValue(0);

      // Fire animation sequence
      Animated.parallel([
        // Fade in and scale up
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1.2,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Fade out
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // Particle animations
        Animated.sequence([
          Animated.timing(particle1Anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(particle2Anim, {
            toValue: 1,
            duration: duration - 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(particle3Anim, {
            toValue: 1,
            duration: duration - 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const particle1TranslateY = particle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const particle1Opacity = particle1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const particle2TranslateY = particle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const particle2Opacity = particle2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const particle2TranslateX = particle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const particle3TranslateY = particle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const particle3Opacity = particle3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const particle3TranslateX = particle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Main fire icon */}
      <View style={styles.fireIcon}>
        <Ionicons name="flame" size={24} color="#F59E0B" />
      </View>

      {/* Fire particles */}
      <Animated.View
        style={[
          styles.particle,
          styles.particle1,
          {
            opacity: particle1Opacity,
            transform: [{ translateY: particle1TranslateY }],
          },
        ]}
      >
        <Ionicons name="flame" size={12} color="#F59E0B" />
      </Animated.View>

      <Animated.View
        style={[
          styles.particle,
          styles.particle2,
          {
            opacity: particle2Opacity,
            transform: [
              { translateY: particle2TranslateY },
              { translateX: particle2TranslateX },
            ],
          },
        ]}
      >
        <Ionicons name="flame" size={10} color="#EF4444" />
      </Animated.View>

      <Animated.View
        style={[
          styles.particle,
          styles.particle3,
          {
            opacity: particle3Opacity,
            transform: [
              { translateY: particle3TranslateY },
              { translateX: particle3TranslateX },
            ],
          },
        ]}
      >
        <Ionicons name="flame" size={8} color="#F59E0B" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fireIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particle1: {
    top: 5,
    left: 10,
  },
  particle2: {
    top: 8,
    right: 5,
  },
  particle3: {
    top: 10,
    left: 5,
  },
});

