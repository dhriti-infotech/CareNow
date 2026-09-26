# CareNow — RuralCare Mobile App

CareNow is the React Native / Expo mobile application for the RuralCare healthcare platform.

## Project structure

Application source code is organized under `src/`.

```text
RuralCare/
├── src/
│   ├── app/                 # Expo Router screens and layouts
│   │   ├── (tabs)/          # Patient tab navigation
│   │   ├── _layout.tsx      # Root navigation/auth provider
│   │   ├── index.tsx
│   │   ├── professional-home.tsx
│   │   ├── professional-requests.tsx
│   │   ├── professional-wallet.tsx
│   │   └── ...
│   │
│   ├── api/                 # Backend API clients
│   ├── components/          # Reusable UI components
│   ├── config/              # Application configuration
│   ├── constants/           # Theme/constants
│   ├── context/             # React contexts
│   ├── data/                # Local development/sample data
│   ├── hooks/               # React hooks
│   ├── services/            # Authentication, notifications, requests, etc.
│   ├── types/               # TypeScript types/declarations
│   ├── assets/              # Application images/assets
│   └── scripts/             # Development scripts
│
├── android/                 # Generated/native Android project
├── ios/                     # Generated/native iOS project
├── app.json                 # Expo configuration
├── package.json
└── tsconfig.json
```

`src/app` is the Expo Router route directory. The other application modules live beside it under `src/` and are imported using the `@/` alias.

## Development

Install dependencies:

```bash
npm install
```

Start Metro with a clean cache after structural/navigation changes:

```bash
npx expo start --clear
```

Build the Android development app:

```bash
npx expo run:android --device
```

## Professional navigation

The professional dashboard uses a custom bottom navigation bar. It is safe-area aware so it stays above the Android system navigation area. Top-level professional destinations use replacement navigation so switching between dashboard sections does not create an unnecessary back-stack.

Android Back behavior:

- Professional Home → normal Android Back behavior.
- Requests → Professional Home.
- Security Wallet/Earnings → Professional Home.
- Profile → Professional Home.

## Architecture rule

Keep application TypeScript/TSX/JS/JSX source inside `src/`.

Keep Expo/React Native project configuration such as `package.json`, `app.json`, `tsconfig.json`, and native `android/` / `ios/` projects at the repository root.
