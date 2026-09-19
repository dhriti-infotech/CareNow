# CareNow Live Nurse Tracking

## User flow

1. Patient submits Nurse at Home request.
2. Request remains in SEARCHING/OFFERED while CareNow looks for a nurse.
3. When a nurse accepts, the patient request automatically opens `nurse-on-the-way`.
4. The tracking page shows:
   - assigned nurse name
   - nurse profile picture when available
   - nurse/current status
   - patient destination marker
   - nurse live GPS marker
   - automatic location refresh
5. The map polls the backend every 5 seconds.

## Nurse location publishing

While the nurse is AVAILABLE or BUSY, the professional app watches foreground GPS position and sends coordinates to:

`PATCH /api/professional-nurse/location`

The existing backend stores the latest latitude/longitude and timestamp on `professional_nurse_profile`.

## Patient tracking APIs

`GET /api/user/patient/requests/{requestId}/nurse-location`

Returns the assigned nurse's latest coordinates and status. Access is restricted to the patient who owns the request.

`GET /api/user/patient/requests/{requestId}/professional-picture`

Returns the assigned nurse's profile picture only for the patient who owns the request and only after a professional is assigned.

## Map dependency

The frontend adds `react-native-maps`.

Install the SDK-compatible dependency with:

```bash
npx expo install react-native-maps
```

For Android production builds, configure a Google Maps Android API key in the Expo native build configuration. iOS can use the default Apple Maps provider with this implementation.

## Live-location limitation

This implementation uses foreground location tracking. The nurse's app must remain active/in the foreground for continuous GPS updates. Background/terminated-app tracking is intentionally not enabled yet because that requires additional background location permissions, task management, and product/privacy decisions.
