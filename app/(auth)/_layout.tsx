import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  // If user is already logged in, redirect to home
  if (session) {
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

