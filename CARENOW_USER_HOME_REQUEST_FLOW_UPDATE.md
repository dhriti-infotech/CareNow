# CareNow User Home & Nurse Request Update

## Changes

### Patient Home
- Removed the Popular Services section.
- Kept the existing CareNow home visual system and navigation.
- Quick services, urgent request card, and trust message remain available.

### Nurse at Home request
- Replaced the four service cards with a service-type dropdown.
- Selected service shows the current server-side price.
- Pricing is loaded from `GET /api/user/patient/service-pricing`.
- Added `Myself` / `Someone else` selection.
- For `Myself`, the authenticated user's name is used.
- For `Someone else`, only the patient's name is requested.
- Removed patient age input from the UI.
- Removed manual house/door/flat, address/village, landmark, and directions fields.
- Location is captured only through the existing GPS/current-location implementation.
- The detected GPS address is used as `locationAddress`; latitude/longitude remain separate for nurse matching.
- Existing request creation, matching, acceptance, and patient notification flow is preserved.

## Backend contract adjustment
`patientAge` is now optional because the new UI no longer collects age.

Flyway migration:
`V15__make_patient_age_optional.sql`

The server-side service price remains authoritative. The backend still validates the submitted `offeredPrice` against configured pricing.
