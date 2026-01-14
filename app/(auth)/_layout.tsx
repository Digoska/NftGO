import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const [isResetting, setIsResetting] = useState(false);
  const [checkingReset, setCheckingReset] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('isResettingPassword').then(val => {
      setIsResetting(val === 'true');
      setCheckingReset(false);
    });
  }, [session]);

  if (loading || checkingReset) {
    return null;
  }

  // Check if we are on the reset-password or signup screen
  // The segments array might look like ['(auth)', 'reset-password'] or ['(auth)', 'signup']
  const isSignupOrReset = segments[1] === 'reset-password' || segments[1] === 'signup';

  // If user is already logged in, redirect to home
  // But allow staying on reset-password screen (which uses a recovery session) or signup screen (setting password)
  if (session && !isSignupOrReset && !isResetting) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-of-service" />
    </Stack>
  );
}

