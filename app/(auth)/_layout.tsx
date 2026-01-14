import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return null;
  }

  // Check if we are on the reset-password screen
  // The segments array might look like ['(auth)', 'reset-password']
  const inAuthGroup = segments[0] === '(auth)';
  const isResetPassword = segments[1] === 'reset-password';

  // If user is already logged in, redirect to home
  // But allow staying on reset-password screen (which uses a recovery session)
  if (session && !isResetPassword) {
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

