# CareNow — Milestone 3
## Authentication, Professionals & Nurse Request Matching

**Status:** Planned — Not Started

### Objective

Milestone 3 moves CareNow from a patient-only UI prototype toward a two-sided healthcare service platform.

The same React Native application will initially support role-based experiences:

```text
PATIENT
NURSE
COMPOUNDER / HEALTHCARE WORKER
PHARMACIST
ADMIN (future)
```

### Target architecture

```text
CareNow Mobile App
        │
   Login / Signup
        │
 ┌──────┴────────┐
 │               │
Patient      Professional
 │               │
 ▼          Nurse / Compounder / Pharmacist
Request          │
 │               ▼
 └──────► Spring Boot API
                 │
             PostgreSQL
```

### 1. Authentication

Preferred first implementation:

```text
Mobile Number
     ↓
OTP
     ↓
Authenticated User
     ↓
Role-based Home
```

Use a mock OTP during development. A production SMS provider can be added later.

### 2. Professional registration

Professionals should register with:

- Name
- Mobile number
- Professional type
- Qualification
- Registration/license details
- Service areas
- Location
- Availability
- Documents

Professional types initially:

```text
Nurse
Compounder / Healthcare Worker
Pharmacist
```

### 3. Verification

Professional status:

```text
PENDING
APPROVED
REJECTED
SUSPENDED
```

Only approved/verified professionals should receive service requests.

### 4. Professional dashboard

Initial experience:

```text
Good Morning, Professional

🟢 Available

New Requests
Active Jobs
Earnings
Profile

Bottom navigation:
Requests | Active | Earnings | Profile
```

### 5. Availability

Professional can switch:

```text
🟢 Available
🔴 Not Available
```

The backend should track:

- Availability
- Current latitude/longitude
- Services offered
- Service area
- Verification status

### 6. Real patient request

Milestone 2's local Nurse request becomes a real backend request.

Conceptual model:

```text
service_request
----------------
id
patient_id
service_id
care_type
patient_name
patient_age
latitude
longitude
address
landmark
directions
urgency
status
created_at
```

Example:

```text
REQ-1001
Service: Nurse at Home
Care: General Nursing Care
Patient: Jyoti
Age: 65
Urgency: As soon as possible
Location: Chandranagar Colony
Landmark: Eureka Model School
Status: SEARCHING
```

### 7. Matching

When a patient requests a nurse:

```text
Create Request
      ↓
Find eligible professionals
      ↓
Verification
      ↓
Professional type/service capability
      ↓
Availability
      ↓
Service area
      ↓
Distance
```

Start with a simple distance/availability algorithm. Do not introduce AI matching yet.

### 8. Professional request

An eligible nurse should see:

```text
🔔 New Nurse Request

General Nursing Care
Patient: Jyoti
Age: 65

Approx. distance: 1.8 km
Area: Chandranagar Colony
Urgency: As soon as possible

[ View Request ]
```

### 9. Privacy

Before acceptance, expose minimum necessary information.

#### Before acceptance

```text
Patient name
Age
Service/care type
Approximate location
Area/locality
Urgency
Price information
```

#### After acceptance

Reveal:

```text
Exact address
House / Door / Flat No.
Landmark
Additional directions
Relevant contact information
```

Do not expose a patient's complete address unnecessarily to every professional who receives a request.

### 10. Professional price offer

Initial pricing model:

```text
Patient requests nurse
        ↓
Nurse receives request
        ↓
Nurse reviews service/location
        ↓
Nurse offers ₹250
        ↓
Patient receives offer
        ↓
Patient accepts or declines
```

Patient sees:

```text
Verified Nurse
Rating: 4.8

Distance: 1.8 km
Service charge: ₹250
Estimated arrival: Within 1 hour

[ Accept ₹250 ]
[ Decline ]
```

Future pricing can support:

- Fixed pricing
- Professional pricing
- Distance charges
- Emergency charges
- Platform commission
- Negotiated pricing

### 11. Request lifecycle

```text
CREATED
   ↓
SEARCHING
   ↓
OFFERED
   ↓
ACCEPTED
   ↓
PROFESSIONAL_EN_ROUTE
   ↓
ARRIVED
   ↓
IN_SERVICE
   ↓
COMPLETED
```

Alternative states:

```text
SEARCHING → EXPIRED
OFFERED → DECLINED → SEARCHING
```

### 12. Initial database

#### users

```text
id
mobile
name
role
status
created_at
```

#### professionals

```text
id
user_id
professional_type
qualification
registration_number
verification_status
available
latitude
longitude
```

#### services

```text
id
name
category
```

#### service_requests

```text
id
patient_id
service_id
care_type
status
urgency
latitude
longitude
address
landmark
directions
created_at
```

#### service_offers

```text
id
request_id
professional_id
offered_price
status
created_at
```

#### service_assignments

```text
id
request_id
professional_id
accepted_offer_id
status
```

### 13. Backend technology

Recommended:

```text
Spring Boot
Java
PostgreSQL
REST API
```

Potential real-time mechanisms:

```text
WebSocket
SSE
Push Notifications
```

Do not add Kafka, Redis, Kubernetes, or microservices unless an actual requirement emerges. Build the smallest reliable service first.

### 14. Initial API concepts

Authentication:

```text
POST /auth/request-otp
POST /auth/verify-otp
```

Professional:

```text
POST /professionals/register
GET  /professionals/profile
PUT  /professionals/availability
```

Requests:

```text
POST /service-requests
GET  /service-requests/{id}
GET  /professional/requests
GET  /professional/requests/{id}
```

Offers:

```text
POST /service-requests/{id}/offers
POST /service-requests/{id}/accept-offer
POST /service-requests/{id}/decline-offer
```

These are initial concepts and should be refined during implementation.

### 15. Implementation breakdown

```text
M3.1 Backend + PostgreSQL
        ↓
M3.2 Authentication
        ↓
M3.3 Roles
        ↓
M3.4 Professional Registration
        ↓
M3.5 Professional Availability
        ↓
M3.6 Connect Nurse Request to Backend
        ↓
M3.7 Professional Request Inbox
        ↓
M3.8 Matching
        ↓
M3.9 Professional Price Offer
        ↓
M3.10 Patient Accept/Decline
        ↓
M3.11 Assignment + Status
```

### 16. Milestone 3 success criteria

The milestone is successful when this works with a real backend:

```text
Patient logs in
      ↓
Requests Nurse at Home
      ↓
Backend stores request
      ↓
Available verified nurse is identified
      ↓
Nurse sees request
      ↓
Nurse views relevant details
      ↓
Nurse offers price
      ↓
Patient sees nurse + price
      ↓
Patient accepts
      ↓
Backend assigns nurse
      ↓
Both sides see ACCEPTED
```

### 17. Out of scope

Not required for this milestone:

- Payments
- Full pharmacy ordering
- Medicine delivery
- Medical equipment ordering
- Admin portal
- Advanced maps
- Live nurse tracking
- Ratings/reviews
- Insurance
- Full prescription verification
- Production document verification
- Production SMS provider
- Production push notification infrastructure
- Advanced pricing engine
- AI matching

### Core product principle

CareNow is a two-sided service platform:

```text
PATIENT NEED
     ↓
SERVICE REQUEST
     ↓
ELIGIBLE PROFESSIONALS
     ↓
AVAILABILITY + LOCATION
     ↓
PROFESSIONAL OFFER
     ↓
PATIENT ACCEPTANCE
     ↓
SERVICE
```
