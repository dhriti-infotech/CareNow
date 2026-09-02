# CareNow — Milestone 2
## Nurse at Home Request Flow

**Status:** Complete — Mobile Prototype

### Objective

Milestone 2 converts the CareNow Home UI into a working patient-side Nurse at Home request prototype.

```text
Home
  ↓
Nurse at Home
  ↓
Select care requirement
  ↓
Patient details
  ↓
Service urgency
  ↓
GPS location
  ↓
Auto-populated address
  ↓
House / Door / Flat No.
  ↓
Landmark / directions
  ↓
Request Nurse
  ↓
Nurse request submitted
  ↓
Finding a nurse
```

### Completed

- Nurse at Home navigation
- Care requirement selection:
  - General Nursing Care
  - Elderly Care
  - Post-Hospital Care
  - Wound Care
- Patient name and age
- Urgency:
  - As soon as possible
  - Schedule for later (UI placeholder)
- GPS permission and current location
- Reverse geocoding and editable address
- House / Door / Flat No.
- Address / Village
- Nearby landmark
- Additional directions
- Additional nursing information
- Request Nurse action
- Request submitted screen
- Finding a nurse status
- End-to-end test on physical Android device

### Location design

The address experience follows a quick-commerce style:

```text
Use my current location
        ↓
Location detected
        ↓
Current address
        ↓
House / Door / Flat No.
        ↓
Address / Village
        ↓
Nearby landmark
        ↓
Additional directions
```

The production model should retain both GPS coordinates and the user-confirmed address because reverse geocoding may not identify an exact rural house.

### Technology

```text
React Native
Expo
TypeScript
Expo Router
Expo Location
Expo Go
Physical Android device
```

Android Studio is not required for the current workflow.

### Current request model

The request is still local/mock.

```text
Patient
   ↓
Nurse at Home
   ↓
Request Nurse
   ↓
Finding a nurse
```

Not yet real:

- Backend API
- Database
- Authentication
- Nurse matching
- Professional availability
- Real-time notification
- Professional acceptance
- Price offer
- Payment

### Files

```text
app/request-nurse.tsx
app/nurse-request-submitted.tsx
```

### Git checkpoint

```bash
git add .
git commit -m "feat: complete nurse at home request flow"
```

### Milestone 2 completion

```text
[x] Nurse at Home navigation
[x] Care selection
[x] Patient details
[x] Urgency
[x] GPS/location
[x] Reverse geocoding
[x] Editable address
[x] House/door/flat number
[x] Landmark
[x] Additional directions
[x] Nurse request submission
[x] Confirmation screen
[x] Physical-device testing
```

### Next

Milestone 3 introduces authentication, professional registration, availability, real backend requests, nurse matching, professional offers, and patient acceptance.
