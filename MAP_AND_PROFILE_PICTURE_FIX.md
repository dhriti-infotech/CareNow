# CareNow Map + Android Profile Picture Fix

## Maps
- Android: `PROVIDER_GOOGLE` remains enabled.
- iOS: provider is omitted so `react-native-maps` uses native Apple Maps.
- Fixed `Platform` import in `app/nurse-service-map.tsx`.
- Applied the same platform-specific provider selection to `app/nurse-on-the-way.tsx`.

## Android profile pictures
- Replaced `File.downloadFileAsync()` in `api/authenticatedImage.ts` with `expo/fetch` + authenticated request + `File.write()`.
- This avoids the Android/Expo Go `java.io.FileNotFoundException` seen when downloading authenticated profile images directly to a File destination.
- The downloaded bytes are still normalized to JPEG with `expo-image-manipulator` before display.
