import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import SplashScreen from '../components/common/SplashScreen';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { hasSeenOnboarding, loading: onboardingLoading } = useOnboarding();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Wait for onboarding and auth to load
  if (onboardingLoading || authLoading) {
    return null; // Will show native splash screen
  }

  // Check if user has seen onboarding
  if (hasSeenOnboarding === false) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // If user is logged in, go to tabs
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise go to login
  return <Redirect href="/(auth)/login" />;
}

