# RuralCare – M3 Backend & Production Readiness Plan

## 1. Project Overview

RuralCare is a quick-service healthcare application focused initially on rural and semi-urban areas.

The goal is to provide essential healthcare services at the patient's location or deliver prescribed medicines/equipment quickly, with a target delivery/service window of approximately one hour.

The current mobile application is being developed as a React Native application using Expo and Expo Router.

The current development UI supports two major user categories:

1. Patient / Service Requester
2. Healthcare Professional

Healthcare professionals currently include:

- Nurse
- Health Worker
- Pharmacist

---

# 2. Current Mobile Application Status

## Completed

### Patient side

The following functionality has already been implemented in the mobile application:

- User login / registration UI
- User OTP verification UI using development/sample OTP
- Home screen
- Bottom navigation
- Home
- Orders
- Profile
- Services
- Nurse at Home
- Request Nurse
- Patient location capture
- Current location / GPS integration using `expo-location`
- Address auto-population
- House number
- Nearby landmark
- Additional address/service details
- Nurse request submission
- Nurse request confirmation

### Professional side

Professional registration and login have been implemented in development mode.

Supported professional types:

- Nurse
- Health Worker
- Pharmacist

Professional dashboard currently supports:

### Common dashboard information

- Professional name
- Professional type
- Availability
- Lifetime earnings
- Rating
- Total ratings
- Pending charges payable to RuralCare
- Professional profile navigation

### Nurse / Health Worker

- Requests received
- Services completed
- Service completion rate
- New service requests
- Offered price
- Patient name
- Distance
- Request priority
- View & Accept action

### Pharmacist

- Orders received
- Prescriptions received
- Orders accepted
- Orders fulfilled
- Order fulfillment rate
- New prescription orders
- Patient name
- Number of medicines
- Distance
- Estimated order value
- View Prescription action

### Development data

The current professional dashboard uses development/sample data.

Professional IDs currently used by the development model:

- `PRO001` – Nurse
- `PRO002` – Nurse
- `PRO003` – Health Worker
- `PRO004` – Pharmacist

The development implementation contains:

- `services/professional-stats.ts`
- `services/professional-requests.ts`
- `app/professional-home.tsx`

The dashboard uses the logged-in professional ID to select profession-specific statistics.

---

# 3. Important Development Behaviour

## Professional approval

Newly registered professionals currently enter:

`PENDING`

In development mode, a newly registered professional is automatically approved after five seconds.

Existing approved professionals should NOT go through the five-second approval process again.

This is temporary development behaviour.

In the production system, approval must be controlled by an administrator / operations team.

---

# 4. Current Development Authentication

The current application uses development/sample credentials.

The next major change is to replace this development authentication with a real backend authentication system.

The mobile application should no longer be responsible for validating real users or professionals locally.

The backend becomes the source of truth.

---

# 5. Target Production Architecture

## Mobile Application

React Native + Expo

Responsibilities:

- UI
- Navigation
- Location
- Camera / document upload
- Prescription upload
- API communication
- Push notification registration
- Secure token storage
- Display backend data

The mobile application should NOT contain:

- Production user credentials
- OTP validation logic
- Professional approval logic
- Business pricing rules
- Database credentials
- Admin credentials

---

# 6. Backend

Recommended backend:

- Java
- Spring Boot
- Spring Security
- REST APIs
- PostgreSQL
- Redis where required
- JWT / access token authentication
- Refresh token mechanism
- WebSocket or push notification integration where appropriate

The backend will become the central business layer.

---

# 7. Backend Modules

The backend should be developed incrementally.

## Milestone M4
## Phase B1 – Backend Foundation -- IN Progress....

                 RuralCare Mobile
                 React Native / Expo
                         |
                       HTTPS
                         |
                         ▼
              ┌─────────────────────┐
              │ RuralCare Backend   │
              │ Spring Boot         │
              └──────────┬──────────┘
                         |
              ┌──────────┴──────────┐
              ▼                     ▼
        PostgreSQL              OTP Provider
        Business Data            SMS Gateway
              |
              ▼
       Users / Professionals
       Requests / Orders
       Addresses / Payments



First create the backend project and establish:

- Spring Boot project
- REST API structure
- Configuration management
- PostgreSQL connection
- Database migrations
- Global exception handling
- API response structure
- Logging
- Validation
- Health endpoint
- Environment profiles

Suggested packages:

```text
com.ruralcare
├── config
├── controller
├── dto
├── entity
├── exception
├── repository
├── security
├── service
└── util
```

---

# 8. Phase B2 – Database

PostgreSQL will be the primary relational database.

Initial entities:

## Users

```text
users
```

Fields should include:

- id
- name
- mobile_number
- email
- role
- status
- created_at
- updated_at

Roles:

- USER
- PROFESSIONAL
- ADMIN

---

## Professionals

```text
professionals
```

Fields:

- id
- user_id
- professional_type
- registration_number
- qualification
- experience
- service_radius
- verification_status
- availability_status
- rating
- total_ratings
- created_at
- updated_at

Professional types:

- NURSE
- HEALTH_WORKER
- PHARMACIST

Verification statuses:

- PENDING
- APPROVED
- REJECTED
- SUSPENDED

---

## Addresses

```text
addresses
```

Fields:

- id
- user_id
- address_line
- house_number
- landmark
- village
- city
- district
- state
- pincode
- latitude
- longitude
- is_default
- created_at
- updated_at

---

## Service Requests

```text
service_requests
```

Initial fields:

- id
- user_id
- service_type
- address_id
- additional_details
- offered_price
- status
- assigned_professional_id
- requested_at
- accepted_at
- completed_at

Example status:

```text
REQUESTED
SEARCHING
ACCEPTED
ON_THE_WAY
ARRIVED
IN_PROGRESS
COMPLETED
CANCELLED
```

---

## Prescription Orders

```text
prescription_orders
```

Fields:

- id
- user_id
- pharmacist_id
- address_id
- prescription_file
- status
- estimated_amount
- final_amount
- requested_at
- accepted_at
- delivered_at

---

# 9. Phase B3 – Real-Time OTP Authentication

Replace development OTP with real OTP.

The intended flow:

```text
Mobile
   |
   | Enter mobile number
   v
Backend
   |
   | Generate OTP
   v
OTP Provider
   |
   | SMS
   v
User
   |
   | Enter OTP
   v
Backend
   |
   | Validate OTP
   v
Create / Load User
   |
   | Generate access token
   v
Mobile Application
```

The OTP must be generated and validated by the backend.

The OTP should never be hardcoded in the mobile application.

OTP should have:

- Expiration
- Attempt limit
- Resend cooldown
- Rate limiting
- Maximum verification attempts
- Audit information

Example development configuration:

```text
OTP expiry: 5 minutes
Resend cooldown: 30-60 seconds
Maximum attempts: 5
```

For production, an SMS provider should be integrated.

The exact provider can be selected later based on:

- India SMS delivery
- Cost
- DLT requirements
- API reliability
- Transactional SMS support
- OTP delivery latency

---

# 10. Authentication Model

After successful OTP verification:

```text
Access Token
Refresh Token
```

The access token should be short-lived.

The refresh token should be used to obtain a new access token.

The mobile application should securely store tokens.

Do not store tokens in plain AsyncStorage for production.

Use secure device storage such as:

```text
expo-secure-store
```

---

# 11. User Login Flow

```text
Enter mobile
      |
      v
POST /api/auth/send-otp
      |
      v
OTP sent
      |
      v
Enter OTP
      |
      v
POST /api/auth/verify-otp
      |
      v
Backend identifies USER
      |
      v
JWT tokens
      |
      v
User Home
```

---

# 12. Professional Login Flow

The same authentication mechanism can be used for professionals.

```text
Enter mobile
      |
      v
POST /api/auth/send-otp
      |
      v
OTP verification
      |
      v
Backend identifies PROFESSIONAL
      |
      v
Load professional profile
      |
      +---- PENDING ----> Verification screen
      |
      +---- APPROVED ---> Professional Dashboard
      |
      +---- REJECTED ---> Rejection information
      |
      +---- SUSPENDED --> Account suspended
```

Important:

Professional approval must be persisted in PostgreSQL.

The five-second development approval must be removed from production.

---

# 13. Phase B4 – Professional Registration

Professional registration should collect information such as:

- Name
- Mobile
- Professional type
- Qualification
- Registration/license number
- Years of experience
- Service area
- Address
- Identity documents
- Professional documents
- Profile photograph

For pharmacists, appropriate pharmacy registration/license information should be captured.

After registration:

```text
PENDING
```

An administrator/operations user verifies the professional.

Then:

```text
APPROVED
```

or:

```text
REJECTED
```

---

# 14. Phase B5 – Service Request Matching

When a patient requests a nurse or health worker:

```text
Patient
   |
   | Request service
   v
Backend
   |
   | Find nearby available professionals
   v
Matching Engine
   |
   +---- Nurse
   +---- Health Worker
   |
   v
Send request notification
   |
   v
Professional
```

Matching can initially use:

- Professional type
- Availability
- Service radius
- Distance
- Account status
- Existing active request

Later it can be enhanced with:

- Rating
- Response rate
- Completion rate
- Current workload
- ETA
- Dynamic pricing

---

# 15. Phase B6 – Professional Request Acceptance

Professional receives:

- Patient/service type
- Patient location
- Distance
- Additional details
- Offered price
- Request priority

Professional can:

```text
ACCEPT
REJECT
```

After acceptance:

```text
REQUESTED
    ↓
ACCEPTED
    ↓
ON_THE_WAY
    ↓
ARRIVED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

---

# 16. Phase B7 – Pharmacist Prescription Flow

Patient:

```text
Upload Prescription
        |
        v
Create Medicine Order
        |
        v
Find nearby available Pharmacists
        |
        v
Notify Pharmacists
```

Pharmacist receives:

- Prescription image/PDF
- Patient location
- Delivery address
- Distance
- Requested delivery time
- Estimated order information

Pharmacist can:

```text
ACCEPT
REJECT
```

After accepting:

```text
PRESCRIPTION_RECEIVED
        ↓
ORDER_ACCEPTED
        ↓
MEDICINES_PREPARED
        ↓
OUT_FOR_DELIVERY
        ↓
DELIVERED
```

Prescription files should be stored in object storage rather than directly inside PostgreSQL.

---

# 17. Phase B8 – Notifications

Notification architecture should support:

## Push notifications

For:

- New service request
- Request accepted
- Professional arriving
- Service completed
- New prescription order
- Order accepted
- Order dispatched
- Order delivered

The mobile application will register an Expo push token.

Backend stores:

```text
user_id
device_id
push_token
platform
created_at
updated_at
```

---

# 18. Notification Flow

Example:

```text
Patient requests Nurse
        |
        v
Backend creates service request
        |
        v
Find nearby nurses
        |
        v
Fetch device push tokens
        |
        v
Send notification
        |
        v
Nurse mobile
        |
        v
"New Nurse at Home request"
```

---

# 19. Phase B9 – Real-Time Updates

Push notifications are the primary notification mechanism.

For screens requiring live state updates, we can later introduce:

- WebSocket
- Server-Sent Events
- Polling as a fallback

Example:

```text
Patient waiting for nurse
        |
        +--> Request accepted
        |
        +--> Nurse on the way
        |
        +--> Nurse arrived
        |
        +--> Service completed
```

The patient UI should update without requiring manual refresh.

---

# 20. Phase B10 – Location

The existing mobile application already uses:

```text
expo-location
```

The production backend should receive:

```text
latitude
longitude
```

The backend can calculate nearby professionals.

For the initial version:

- Store latitude/longitude in PostgreSQL
- Use geographic distance queries
- Start with a configurable service radius

Later we can introduce PostGIS if the geographic matching requirements become more advanced.

---

# 21. Phase B11 – Payments

Payments should be implemented after the basic service workflow is stable.

Potential future components:

- Patient payment
- Professional earnings
- RuralCare platform fee
- Pending professional charges
- Refunds
- Settlement
- Transaction history

The current dashboard field:

```text
Pending Charges
```

will eventually come from actual transactions rather than development data.

---

# 22. Phase B12 – Admin

An administrative system will eventually be required.

Admin functionality:

- Approve professionals
- Reject professionals
- Suspend professionals
- View users
- View service requests
- View medicine orders
- Monitor active services
- Manage service pricing
- Manage platform commission
- View payments
- View disputes
- View ratings
- Monitor notifications

---

# 23. Recommended Development Order

We should NOT implement everything at once.

Implement in this exact order:

### Step 1 — Backend Foundation

Create:

```text
ruralcare-backend
```

Set up:

- Spring Boot
- Java
- Maven/Gradle
- PostgreSQL
- Configuration
- Health API

---

### Step 2 — Database

Create:

- users
- professionals
- addresses
- service_requests
- prescription_orders

Use database migrations.

Recommended:

```text
Flyway
```

---

### Step 3 — Authentication

Implement:

- Send OTP
- Verify OTP
- User creation
- Professional identification
- JWT access token
- Refresh token
- Logout

---

### Step 4 — Connect React Native

Replace:

```text
users.json
```

authentication with:

```text
Backend REST API
```

---

### Step 5 — Professional Registration

Connect the existing professional registration UI to the backend.

---

### Step 6 — Professional Approval

Replace five-second development approval with:

```text
Database status
+
Admin approval
```

---

### Step 7 — Nurse / Health Worker Requests

Connect:

```text
Patient → Request Nurse
```

to:

```text
Backend → Matching → Professional
```

---

### Step 8 — Pharmacist Prescription

Connect:

```text
Patient → Upload Prescription
```

to:

```text
Backend → Pharmacist
```

---

### Step 9 — Notifications

Implement:

- Expo Push Notifications
- Device token registration
- New request notification
- Acceptance notification
- Status notifications

---

### Step 10 — Real-Time Tracking

Implement live request status.

---

# 24. Development Environments

We should maintain separate environments:

```text
development
staging
production
```

Example:

```text
React Native
     |
     +---- Development API
     |
     +---- Staging API
     |
     +---- Production API
```

Never put production credentials into the development application.

---

# 25. Suggested Backend Project

Initial project:

```text
ruralcare-backend/
```

Suggested structure:

```text
ruralcare-backend
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com.ruralcare
│   │   │       ├── config
│   │   │       ├── controller
│   │   │       ├── dto
│   │   │       ├── entity
│   │   │       ├── exception
│   │   │       ├── repository
│   │   │       ├── security
│   │   │       ├── service
│   │   │       └── util
│   │   │
│   │   └── resources
│   │       ├── db
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test
│
├── build.gradle
└── README.md
```

---

# 26. First Backend Milestone

The immediate next milestone is:

## M4.1 – Backend Foundation

Deliverables:

- Spring Boot backend
- Java 17+
- PostgreSQL
- Flyway
- Health endpoint
- Environment configuration
- Global API response format
- Global exception handling
- Validation
- Docker Compose for local PostgreSQL
- Initial database migration
- Backend connected to PostgreSQL

Only after M4.1 is working should we start real OTP authentication.

---

# 27. Important Principle

The existing React Native UI should be preserved as much as possible.

We should progressively replace development/sample logic behind the existing screens rather than rebuilding the UI.

Target architecture:

```text
                RuralCare Mobile App
                         |
                         | HTTPS
                         v
              RuralCare Spring Boot API
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
   PostgreSQL          OTP SMS        Notifications
        |
        v
  Business Data
```

The development sample data is temporary and will gradually be replaced by API responses.

---

# 28. Current Status

```text
M1   Patient UI                         DONE
M2   Nurse-at-home flow                DONE
M3.1 Professional login/registration   DONE
M3.2 Professional dashboard            DONE
M3.3 Sample professional data          DONE
M3.4 Pharmacist dashboard              DONE

M4.1 Backend foundation                NEXT
M4.2 Database                           NEXT
M4.3 Real-time OTP authentication       NEXT
M4.4 User/professional API integration  NEXT
M4.5 Professional approval              NEXT
M4.6 Service request backend             NEXT
M4.7 Pharmacist prescription backend     NEXT
M4.8 Notifications                       NEXT
M4.9 Real-time status updates             NEXT
M4.10 Payments                            FUTURE
M4.11 Admin portal                        FUTURE
```

---

# 29. Development Rule Going Forward

For each milestone:

1. Build backend functionality.
2. Test backend independently.
3. Connect React Native UI.
4. Test on Android physical device.
5. Fix errors.
6. Commit changes to Git.
7. Update this document.
8. Move to the next milestone.

We will not jump directly to OTP, notifications, payments, etc. before the backend foundation and database are stable.
