# CareNow Google Maps configuration

Google Maps is configured through the `react-native-maps` Expo config plugin.

The project currently contains sample placeholder values:

- Android: `AIza67andriod`
- iOS: `AIza768ios`

Replace those values in `app.json` with the real Google Maps API keys before creating a native build.

The app uses `PROVIDER_GOOGLE` in `app/nurse-on-the-way.tsx`.

## After replacing the keys

For a native Android/iOS development or production build, rebuild the app so the native Google Maps configuration is embedded. A Metro restart alone does not update native configuration.

For Android, restrict the key to the CareNow Android package and the SHA-1 certificate used by the build. For iOS, restrict the key to the CareNow iOS bundle identifier.
