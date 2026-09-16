# CareNow — Professional Requests / Dashboard / Notification Fix

## What changed

### 1. Professional Requests tab
- The Requests item in the professional dashboard bottom navigation now opens `professional-requests`.
- The `View All` action on Today's Activity opens the same real request screen.
- Requests are loaded from `GET /api/professional-nurse/requests`.
- Accept and decline actions use the existing backend endpoints.
- A request ID received from a push notification opens the Requests screen and highlights that request.

### 2. Today's Activity
The professional dashboard no longer falls back to `developmentServiceRequests`.

Today's Activity is populated from the real dashboard API:
- `activeServices`
- `newServiceRequests`

The list is sorted by `requestedAt` and limited to three items for the existing UI.

### 3. Dashboard metrics
The hardcoded `developmentProfessionalStats` values are no longer used by the professional dashboard.

The nurse dashboard calls:

`GET /api/professional-nurse/dashboard`

and uses:
- `earnings.lifetime`
- `serviceActivity.servicesCompleted`
- `serviceActivity.completionRate`
- `rating.average`

### 4. Real-time request notification
The backend already exposes:

`POST /api/professional-nurse/notifications/push-token`

and sends an Expo push notification when a matching nurse offer is created.

The frontend now:
- requests notification permission
- creates the Android `service-requests` channel
- obtains the Expo push token using the EAS project ID
- registers the token with the authenticated backend account
- displays push notifications while the app is in the foreground
- handles notification taps
- opens the real Requests screen for `NURSE_SERVICE_REQUEST`

### 5. UI constraint
The existing professional dashboard UI/layout/styles were not redesigned as part of this fix. Changes are data wiring, navigation, and notification behavior.

## Dependency setup

The project now declares:
- `expo-device`
- `expo-notifications`

Run this after extracting the project so Expo resolves the exact compatible package versions and refreshes `package-lock.json`:

```bash
npx expo install expo-device expo-notifications
```

Then install dependencies:

```bash
npm install
```

## Push notification build requirement

Remote push notifications require a native/development build. Expo Go on Android does not support remote push notifications for this SDK flow.

Use:

```bash
npx expo run:android
```

or an EAS development build.

For testing, use a physical device or a supported emulator/device configuration with push notification services.

## Backend

Use the latest CareNow realtime backend that already contains:
- `V13__add_nurse_live_location_and_push_tokens.sql`
- `/api/professional-nurse/dashboard`
- `/api/professional-nurse/notifications/push-token`
- push delivery through Expo Push Service
- live location matching and stale-location protection

No backend endpoint contract was invented by the frontend changes in this fix.
