import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { AuthProvider } from '../context/auth-context';


export const unstable_settings = {
  anchor: 'index',
};


export default function RootLayout() {
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
        <Stack.Screen name="professional-verification" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="request-nurse" options={{ headerShown: false }} />
        <Stack.Screen name="nurse-request-submitted" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
