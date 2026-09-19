import { router, Stack } from 'expo-router';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { AuthProvider } from '../context/auth-context';
import {
  addProfessionalNotificationResponseListener,
  getInitialProfessionalNotificationRequestId,
} from '../services/professional-notifications';

export const unstable_settings = {
  anchor: 'index',
};

/**
 * Keep the navigator in a child component of AuthProvider.
 *
 * Expo Router renders route components through the navigator. Keeping the
 * navigator itself below the provider guarantees that every route (including
 * the initial index route) receives the same AuthContext during the initial
 * render and prevents `useAuth must be used within an AuthProvider` errors.
 */
function RootNavigator() {
  useEffect(() => {
    const subscription = addProfessionalNotificationResponseListener((requestId) => {
      router.push({ pathname: '/professional-requests', params: { requestId } });
    });

    void getInitialProfessionalNotificationRequestId().then((requestId) => {
      if (requestId) {
        router.push({ pathname: '/professional-requests', params: { requestId } });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register-user" options={{ headerShown: false }} />
      <Stack.Screen name="register-professional" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="professional-profile" options={{ headerShown: false }} />
      <Stack.Screen name="professional-home" options={{ headerShown: false }} />
      <Stack.Screen name="professional-requests" options={{ headerShown: false }} />
      <Stack.Screen name="nurse-service-map" options={{ headerShown: false }} />
      <Stack.Screen name="professional-verification" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="request-nurse" options={{ headerShown: false }} />
      <Stack.Screen name="nurse-request-submitted" options={{ headerShown: false }} />
      <Stack.Screen name="rate-service" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
