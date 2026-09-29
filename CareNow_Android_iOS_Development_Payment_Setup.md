# CareNow — Android & iOS Development Payment Setup

This is the step-by-step workflow we used to run the CareNow Expo/React Native app on physical Android and iPhone devices in development mode, with Razorpay Test Mode payments working.

## 1. Start from the CareNow project

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
```

Check:

```bash
node -v
npm -v
java -version
npx expo --version
```

For iOS:

```bash
xcodebuild -version
pod --version
```

## 2. Start the Spring Boot backend

The local backend must use the `local` Spring profile so that `application-local.yml` is loaded.

Example:

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

Or, from IntelliJ, run with:

```text
-Dspring.profiles.active=local
```

The backend in our development setup runs on:

```text
http://192.168.1.2:8082
```

Do not use `localhost` or `127.0.0.1` from a physical phone.

## 3. CareNow API environment

For physical-device development, `env.ts` should select the Mac's LAN address:

```ts
const API_PORT = 8082;

const DEV_HOST = '192.168.1.2';

const getDevelopmentApiBaseUrl = () => {
  return `http://${DEV_HOST}:${API_PORT}`;
};
```

The production URL is:

```text
https://api.dhritex.com
```

Keep the development/prod selection explicit so you do not accidentally point the development app at production.

## 4. Android physical device

### Enable Developer Options

On Android:

1. Settings → About phone.
2. Tap Build number several times.
3. Open Developer options.
4. Enable USB debugging.
5. Connect the phone to the Mac.
6. Accept the USB debugging/trust prompt.

Verify:

```bash
adb devices
```

The phone should appear as:

```text
XXXXXXXX    device
```

If it says `unauthorized`, unlock the phone and accept the prompt.

## 5. Build/install CareNow on Android

From the project root:

```bash
npx expo run:android --device
```

Select the connected physical Android device.

This builds the native Android development build and installs it.

Then start Metro when needed:

```bash
npx expo start --dev-client
```

The installed development build connects to Metro.

## 6. Android payment test

Use this flow:

1. Start Spring Boot with the `local` profile.
2. Confirm the phone and Mac are on the same network.
3. Confirm CareNow uses `http://<Mac-LAN-IP>:8082`.
4. Launch the development build.
5. Login/register.
6. Open the professional wallet/security-deposit payment flow.
7. Create the Razorpay test order.
8. Complete the Razorpay Test Mode payment.
9. Check Spring Boot logs for successful Razorpay order creation/payment processing.

The Razorpay secret must remain on the backend.

## 7. iPhone physical device

Connect the iPhone to the Mac with USB.

1. Unlock the iPhone.
2. Select **Trust This Computer** if prompted.
3. Enter the iPhone passcode.
4. Enable Developer Mode:

```text
Settings
→ Privacy & Security
→ Developer Mode
→ ON
```

The phone may restart. Confirm Developer Mode after restart.

## 8. Verify the physical iPhone

Run:

```bash
xcrun xctrace list devices
```

The physical device should appear under `== Devices ==`, for example:

```text
Roshan’s iPhone (26.6.1) (00008120-0016351C0201A01E)
```

Do not confuse it with simulator entries.

## 9. Verify the CareNow Xcode destination

From the **RuralCare project root**:

```bash
xcodebuild   -workspace ios/CareNow.xcworkspace   -scheme CareNow   -showdestinations
```

The physical iPhone should appear similar to:

```text
{ platform:iOS, arch:arm64, id=00008120-0016351C0201A01E, name=Roshan’s iPhone }
```

## 10. Open the correct Xcode file

Always open the CocoaPods workspace:

```bash
open ios/CareNow.xcworkspace
```

Use:

```text
CareNow.xcworkspace
```

not:

```text
CareNow.xcodeproj
```

## 11. Configure iOS signing

In Xcode:

1. Select the CareNow project.
2. Select the CareNow target.
3. Open **Signing & Capabilities**.
4. Select the Apple development Team.
5. Enable **Automatically manage signing**.

For a physical device, Apple development signing is required.

We encountered:

```text
No code signing certificates are available to use.
```

Selecting the Apple development team and allowing Xcode to manage signing resolved the signing setup.

## 12. Push Notifications capability

We also encountered:

```text
Personal development teams, including "Roshan Singh",
do not support the Push Notifications capability.
```

and:

```text
Entitlements file defines the value "aps-environment"
```

If Push Notifications are not required for the current development build, remove/disable that capability from the CareNow target in:

```text
Signing & Capabilities
```

If Push Notifications are required, use an Apple Developer team/profile that supports the capability.

## 13. CocoaPods

From the project root:

```bash
cd ios
pod install
cd ..
```

If dependencies are damaged, reinstall:

```bash
rm -rf node_modules
npm install

cd ios
pod install
cd ..
```

Avoid running `expo prebuild` unnecessarily if you have intentional native changes.

## 14. Expo Constants build issue we encountered

We encountered:

```text
[CP-User] Generate app.config for prebuilt Constants.manifest
```

and:

```text
No such file or directory:
.../get-app-config-ios.sh
```

Verify the Expo Constants script:

```bash
ls -la node_modules/expo-constants/scripts/get-app-config-ios.sh
```

It should exist.

The script is:

```text
node_modules/expo-constants/scripts/get-app-config-ios.sh
```

The important issue was that Xcode's Pods build phase must provide the expected `PROJECT_DIR`/Pods environment rather than a manually supplied incorrect path.

Do not hard-code a machine-specific `/Users/...` path into the Expo script.

## 15. Build/install on the physical iPhone

Once:

- iPhone is connected
- Developer Mode is enabled
- Xcode sees the phone
- signing is configured

run:

```bash
npx expo run:ios --device
```

Or explicitly:

```bash
npx expo run:ios --device "Roshan’s iPhone"
```

Expo should use the physical iPhone's device identifier.

## 16. If Expo says no development build is installed

If you see:

```text
No development build (com.dhritiinfotechexpo.CareNow)
for this project is installed.
```

build/install it first:

```bash
npx expo run:ios --device "Roshan’s iPhone"
```

Then start:

```bash
npx expo start --dev-client
```

## 17. If you see "No script URL provided"

We encountered:

```text
No script URL provided.
Make sure the packager is running or you have embedded a JS bundle in your application bundle.
```

For a development build, start Metro:

```bash
npx expo start --dev-client
```

Then open the installed CareNow development build.

## 18. Razorpay development configuration

Use Razorpay **Test Mode** credentials for development.

The backend needs:

```text
Razorpay Key ID
Razorpay Key Secret
```

Keep the secret on the Spring Boot backend.

Do not put the Razorpay secret into React Native code.

During our successful local test, backend logs showed:

```text
Razorpay online payment availability=true
```

then:

```text
POST https://api.razorpay.com/v1/orders
status=200
```

and an order ID such as:

```text
order_XXXXXXXX
```

## 19. Razorpay Test Mode OTP

When the Razorpay Test Mode payment flow asks for an OTP, use the test OTP/credentials specified by Razorpay's current Test Mode flow.

Do not use a real bank OTP for Test Mode.

## 20. Razorpay authentication error

We diagnosed a production-backend failure with:

```text
HTTP 401
```

and:

```json
{"error":{"code":"BAD_REQUEST_ERROR","description":"Authentication failed"}}
```

Check:

1. Razorpay Key ID.
2. Razorpay Key Secret.
3. Test vs Live mode.
4. Hosting-platform environment variables.
5. Extra spaces/newlines in credentials.
6. Restart the backend after changing environment variables.

Our local backend succeeded because it had valid Razorpay credentials.

## 21. Useful iOS commands

List devices:

```bash
xcrun xctrace list devices
```

Show installed SDKs:

```bash
xcodebuild -showsdks
```

Show CareNow destinations:

```bash
xcodebuild   -workspace ios/CareNow.xcworkspace   -scheme CareNow   -showdestinations
```

Open workspace:

```bash
open ios/CareNow.xcworkspace
```

Install pods:

```bash
cd ios
pod install
cd ..
```

Build/install:

```bash
npx expo run:ios --device
```

## 22. Useful Android commands

Check device:

```bash
adb devices
```

Build/install:

```bash
npx expo run:android --device
```

Start development server:

```bash
npx expo start --dev-client
```

## 23. Complete Android sequence

### Terminal 1 — backend

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
./gradlew bootRun --args='--spring.profiles.active=local'
```

### Terminal 2 — Metro

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
npx expo start --dev-client
```

### Terminal 3 — Android

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
adb devices
npx expo run:android --device
```

Then test:

```text
CareNow
→ Login
→ Professional
→ Wallet/Security Deposit
→ Razorpay Test Payment
```

Check backend logs for the Razorpay order/payment result.

## 24. Complete iPhone sequence

### Terminal 1 — backend

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
./gradlew bootRun --args='--spring.profiles.active=local'
```

### Terminal 2 — Metro

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
npx expo start --dev-client
```

### Terminal 3 — iOS

```bash
cd "/Users/roshan/Desktop/Dhriti Infotech/repos/RuralCare"
xcrun xctrace list devices
npx expo run:ios --device "Roshan’s iPhone"
```

Then test the same Razorpay payment flow.

## 25. Development architecture

```text
Android / iPhone
       |
       | LAN
       v
Mac
       |
       +--> Expo Metro / Development Build
       |
       v
Spring Boot local backend :8082
       |
       +--> PostgreSQL / Neon
       |
       +--> Razorpay Test Mode
```

Production is different:

```text
Android / iPhone
       |
       v
https://api.dhritex.com
       |
       v
Cloud Spring Boot backend
       |
       +--> PostgreSQL / Neon
       |
       +--> Razorpay Production Mode
```

## 26. Final checklist

### Android

- [ ] Developer Options enabled
- [ ] USB debugging enabled
- [ ] `adb devices` shows the phone
- [ ] Mac and phone can reach each other over the network
- [ ] Local Spring profile is active
- [ ] `API_BASE_URL` points to Mac LAN IP
- [ ] Development build installed
- [ ] Metro running
- [ ] Razorpay Test Mode credentials configured on backend

### iPhone

- [ ] iPhone trusted by Mac
- [ ] Developer Mode enabled
- [ ] `xcrun xctrace list devices` shows the iPhone
- [ ] CareNow workspace opens successfully
- [ ] Apple development team selected
- [ ] Automatic signing configured
- [ ] Push Notifications capability handled appropriately
- [ ] CocoaPods installed
- [ ] Development build installed
- [ ] Metro running
- [ ] Local API URL reachable from iPhone
- [ ] Razorpay Test Mode credentials configured on backend

### Razorpay

- [ ] Backend has Key ID
- [ ] Backend has Key Secret
- [ ] Correct Test/Live mode selected
- [ ] Backend can create Razorpay orders
- [ ] HTTP 200 received from `/v1/orders`
- [ ] Razorpay order ID returned
- [ ] Test payment completes
- [ ] Backend payment verification/webhook flow is tested separately
