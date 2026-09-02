# CareNow --- Milestone 1 Development Progress

**Project:** CareNow\
**Milestone:** 1 --- Mobile Foundation & Initial Patient Flow\
**Status:** In Progress\
**Checkpoint:** Initial patient UI and healthcare-service navigation
completed

------------------------------------------------------------------------

## 1. Objective

The first milestone is to establish the CareNow mobile application
foundation and implement the first meaningful patient journey.

The agreed first flow is:

``` text
Home
  ↓
Healthcare Services
  ↓
Select Service
  ↓
Request Service
```

At this checkpoint, the mobile UI and navigation for this flow are
working on a physical Android device using Expo Go.

------------------------------------------------------------------------

## 2. Development Environment

The development environment is running on macOS without Android Studio.

  Tool                 Version / Setup
  -------------------- ------------------------
  Node.js              24.19.0
  npm                  11.17.0
  Git                  2.39.5
  NVM                  0.40.6
  Mobile framework     React Native
  App framework        Expo
  Language             TypeScript
  Navigation           Expo Router
  Development device   Physical Android phone
  Development client   Expo Go
  IDE                  VS Code

The application is successfully running on the Android device.

------------------------------------------------------------------------

## 3. Current Project Structure

Current relevant structure:

``` text
CareNow/
│
└── app/
    ├── _layout.tsx
    ├── modal.tsx
    ├── services.tsx
    ├── request-service.tsx
    │
    └── (tabs)/
        ├── _layout.tsx
        ├── index.tsx
        ├── orders.tsx
        ├── profile.tsx
        └── explore.tsx
```

`explore.tsx` remains in the project but is hidden from the bottom
navigation using Expo Router configuration.

------------------------------------------------------------------------

## 4. Completed Home Screen

The default Expo starter screen has been replaced with the CareNow
patient home screen.

The Home screen currently contains:

### Location

``` text
Your Location
Select your location
```

Location functionality is currently UI-only.

Actual device location will be introduced later.

### Greeting

``` text
Good Morning 👋
How can we help you today?
```

### Search

``` text
Search for a service
```

Search is currently visual only and is intentionally not implemented
yet.

### Core Service Cards

The four primary CareNow services are visible:

1.  Nurse at Home
2.  Injection Service
3.  Prescription Medicines
4.  Medical Equipment

### Rapid Healthcare Request

The Home screen includes:

``` text
Need healthcare quickly?

Request a nearby healthcare worker
```

This currently navigates to the healthcare-services selection screen.

### Popular Services

The following initial services are represented:

-   Injection administration
-   Wound dressing
-   BP / Sugar check
-   Elderly care
-   Nursing visit

### Bottom Navigation

The bottom navigation now contains only:

``` text
Home | Orders | Profile
```

The default Expo Explore tab is hidden.

------------------------------------------------------------------------

## 5. Orders Screen

A basic Orders screen has been created.

Current purpose:

``` text
Your Requests & Orders

Your healthcare service requests, medicine orders,
and equipment orders will appear here.
```

This is currently a placeholder.

Future functionality will include:

-   Active healthcare requests
-   Medicine orders
-   Equipment orders
-   Completed services
-   Order/service history

------------------------------------------------------------------------

## 6. Profile Screen

A basic Profile screen has been created.

Current purpose:

``` text
Your Profile

Manage your profile, saved addresses and
preferences here.
```

This is currently a placeholder.

Future functionality will include:

-   Patient profile
-   Saved addresses
-   Language preference
-   Contact information
-   Request/order history
-   Logout

------------------------------------------------------------------------

## 7. Healthcare Services Screen

A dedicated screen has been created at:

``` text
app/services.tsx
```

The screen is accessible from the Home screen.

Current services:

1.  Injection Administration
2.  Wound Dressing
3.  Blood Pressure Check
4.  Blood Sugar Check
5.  Medicine Administration
6.  Elderly Assistance
7.  Nursing Visit

Each service is represented as a selectable card.

------------------------------------------------------------------------

## 8. Request Service Screen

A dedicated screen has been created at:

``` text
app/request-service.tsx
```

The selected service is passed through Expo Router parameters.

Example:

``` text
/services
      ↓
Select Injection Administration
      ↓
/request-service?service=injection
```

The Request Service screen dynamically displays the selected service.

Current UI contains:

-   Request Service header
-   Selected service
-   Description
-   Four-step progress indicator
-   Service details placeholder
-   Continue button

Current steps shown:

``` text
1. Service
2. Details
3. Location
4. Confirm
```

The Continue button is intentionally not implemented yet.

------------------------------------------------------------------------

## 9. Current Navigation Flow

The following flow is working on the physical Android device:

``` text
                    CareNow Home
                         │
          ┌──────────────┼───────────────┐
          │              │               │
          ▼              ▼               ▼
   Nurse at Home   Injection Service   Urgent
                                      Healthcare
          │              │               │
          └──────────────┼───────────────┘
                         ▼
               Healthcare Services
                         │
                         ▼
                  Select Service
                         │
                         ▼
                  Request Service
```

For example:

``` text
Home
 ↓
Nurse at Home
 ↓
Healthcare Services
 ↓
Injection Administration
 ↓
Request Service
```

The selected service is correctly displayed on the Request Service
screen.

------------------------------------------------------------------------

## 10. Technical Decisions Made

### React Native + Expo

We are using:

``` text
React Native
+
Expo
+
TypeScript
+
Expo Router
```

Android Studio is not part of the planned development workflow.

### Physical Android Device

Initial development/testing is being performed directly on a physical
Android phone using Expo Go.

### No unnecessary dependencies yet

We deliberately have not added:

-   Google Maps
-   Location libraries
-   Firebase
-   Authentication libraries
-   API client
-   Database libraries
-   Payment SDK
-   Image upload libraries

These will be introduced only when the corresponding feature is
implemented.

------------------------------------------------------------------------

## 11. Important Product Architecture Decision

The Request Service flow will be **dynamic based on the selected
service**.

For example:

### Injection Administration

``` text
Service
 ↓
Patient Details
 ↓
Prescription
 ↓
Location
 ↓
Timing
 ↓
Confirmation
```

### Blood Pressure Check

``` text
Service
 ↓
Patient Details
 ↓
Location
 ↓
Timing
 ↓
Confirmation
```

### Nursing Visit

``` text
Service
 ↓
Patient Details
 ↓
Care Requirements
 ↓
Location
 ↓
Timing
 ↓
Confirmation
```

We will use one reusable Request Service flow rather than creating a
separate screen for every service.

------------------------------------------------------------------------

## 12. Deliberately Out of Scope at This Checkpoint

The following are NOT implemented yet:

-   Backend API
-   Database
-   Authentication
-   Real GPS/location
-   Maps
-   Prescription camera/gallery upload
-   Cloud file storage
-   Healthcare worker matching
-   Worker application
-   Pharmacy application
-   Medical equipment ordering
-   Payments
-   Push notifications
-   Admin portal
-   Search functionality
-   Production builds
-   Play Store deployment

These remain future milestones.

------------------------------------------------------------------------

## 13. Next Development Task

The next task is to implement the first real Request Service form.

Starting with:

### Injection Administration

The screen should collect:

``` text
Patient Details

Patient name
Age

Prescription

Upload Prescription

Service Timing

As soon as possible
Target: within 1 hour

OR

Schedule for later
```

The initial implementation will use mock/local state.

We will NOT yet implement:

-   Real camera
-   Real gallery upload
-   Real GPS
-   Backend persistence

Those capabilities will be added after the UI/state flow is stable.

------------------------------------------------------------------------

## 14. Milestone 1 Checkpoint

### Completed

-   [x] macOS development environment
-   [x] Node.js setup
-   [x] Expo setup
-   [x] Expo Go on Android
                    -   [x] CareNow project created
                    -   [x] CareNow Home screen
-   [x] Bottom navigation
-   [x] Home / Orders / Profile
-   [x] Healthcare Services screen
-   [x] Service selection
-   [x] Request Service screen
-   [x] Dynamic service parameter passing
-   [x] Navigation tested on physical Android device

### Next

-   [ ] Request Service details form
-   [ ] Patient details
-   [ ] Prescription requirement handling
-   [ ] Mock prescription upload UI
-   [ ] Service timing selection
-   [ ] Continue to Location step
