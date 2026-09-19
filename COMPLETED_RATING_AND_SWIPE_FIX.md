# CareNow — Completed Service Rating & Tracking Sheet Fix

## Changes

- Patient tracking screen polls the request status and immediately routes to `rate-service` when the backend reports `COMPLETED`.
- Orders also opens the rating screen directly for completed requests.
- Added `POST /api/user/patient/requests/{requestId}/rating` client integration.
- Added a patient rating screen with 1–5 stars, optional review, submit, and rate-later actions.
- Added a draggable bottom sheet to the nurse live-tracking screen. Swipe up expands the sheet; swipe down collapses it. Tapping the handle also toggles it.
- Existing live map, nurse picture, polling, and status flow are preserved.

## Backend dependency

The live-service-flow backend already exposes the patient rating endpoint and only accepts ratings for completed assigned services. No backend change is required for this frontend fix.

## Validation

Static brace/parenthesis balance checks were run on all modified TypeScript files. A full Expo/TypeScript build was not run because the source ZIP does not include `node_modules`.
