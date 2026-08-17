import { Stack } from 'expo-router';
import 'react-native-reanimated';


export const unstable_settings = {
  anchor: '(tabs)',
};


export default function RootLayout() {
  return (
    <Stack initialRouteName="login">
      <Stack.Screen
        name="login"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="register-user"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="register-professional"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="verify-otp"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="professional-profile"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="professional-home"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="request-nurse"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="nurse-request-submitted"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
