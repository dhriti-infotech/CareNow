import { router, Stack } from 'expo-router';
import 'react-native-reanimated';

import { AuthProvider } from '../context/auth-context';
import { useEffect } from 'react';
import {
  addProfessionalNotificationResponseListener,
  getInitialProfessionalNotificationRequestId,
} from '../services/professional-notifications';


export const unstable_settings = {
  anchor: 'index',
};


export default function RootLayout() {
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
    <AuthProvider>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register-user" options={{ headerShown: false }} />
        <Stack.Screen name="register-professional" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="professional-profile" options={{ headerShown: false }} />
        <Stack.Screen name="professional-home" options={{ headerShown: false }} />
        <Stack.Screen name="professional-requests" options={{ headerShown: false }} />
        <Stack.Screen name="professional-verification" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="request-nurse" options={{ headerShown: false }} />
        <Stack.Screen name="nurse-request-submitted" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
