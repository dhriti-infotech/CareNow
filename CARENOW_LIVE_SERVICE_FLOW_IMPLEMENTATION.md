# CareNow Live Nurse Service Flow

Implemented:

1. Requests/offers older than 3 hours expire automatically.
2. SEARCHING/OFFERED requests without an accepted nurse are marked EXPIRED after the expiry window.
3. Nurse decline marks that nurse's offer DECLINED and immediately re-runs matching for other eligible nurses.
4. Patient Orders exposes the real request status, including EXPIRED.
5. ACCEPTED means the nurse is getting ready.
6. Nurse starts the journey -> EN_ROUTE; patient sees "Nurse is on the way".
7. Nurse reaches the patient -> ARRIVED.
8. Nurse starts service -> IN_SERVICE.
9. Nurse can complete service -> COMPLETED.
10. Nurse gets an in-app Google Maps screen with the patient destination and live nurse GPS.
11. Existing patient live tracking remains active for ACCEPTED/EN_ROUTE/ARRIVED/IN_SERVICE.

The map uses the existing react-native-maps configuration and therefore supports the Android and iOS native builds already configured in app.json.

No profile-picture or authentication flow was changed.

## 2026-09-19 decline-status UI fix
- When a nurse declines, the backend correctly returns the request to `SEARCHING` so CareNow can match another eligible nurse.
- The patient UI now reads the existing request-offer data to distinguish a plain search from a declined offer.
- Patient Orders shows `Nurse declined — finding another nurse` when the latest state is `SEARCHING` with declined offers and no active offer.
- The submitted-request screen uses the same status presentation.
- `OFFERED` counts only active `OFFERED` nurse offers, so declined offers are not incorrectly counted as notified nurses.
