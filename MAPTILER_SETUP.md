# CareNow MapTiler setup

Android now uses MapTiler maps rendered through `react-native-webview` + Leaflet so the app can continue to run in Expo Go.

iOS keeps the existing native Apple Maps implementation.

## 1. Create a MapTiler API key

Create an API key in your MapTiler Cloud account and restrict it to the domains/origins appropriate for your application before production use.

## 2. Add the key locally

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_MAPTILER_API_KEY=YOUR_REAL_MAPTILER_KEY
```

Do not commit the real key to source control.

## 3. Restart Metro

```bash
npm install
npx expo start -c
```

## Map behavior

- Android: MapTiler + Leaflet inside WebView.
- iOS: existing native Apple Maps.
- Nurse/patient live coordinates continue to come from the existing CareNow APIs.
- The map automatically fits the patient and nurse positions.
- The dashed line shows the direct nurse-to-patient connection.

## User/patient profile swipe

The bottom patient profile sheet on the nurse service map is now draggable. Swipe upward on the handle to expand it and swipe downward to collapse it. The patient tracking screen uses the same improved gesture handling.

MapTiler's hosted map service is subject to its plan limits. For production, configure the appropriate MapTiler plan and key restrictions.
