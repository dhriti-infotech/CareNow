# CareNow — Generate Android APK with EAS

For the current **CareNow** project, the `eas.json` already has the correct `preview` profile for generating an installable Android APK.

---

## 1. Go to CareNow

Run:

```bash
cd "/Users/roshan/Desktop/DhritiInfotech/repos/CareNow"
```

Verify the current directory:

```bash
pwd
```

Expected:

```text
/Users/roshan/Desktop/DhritiInfotech/repos/CareNow
```

---

## 2. Make sure you are logged into EAS

Run:

```bash
npx eas whoami
```

You should see:

```text
dhriti-infotech-expo
```

If you are not logged in, run:

```bash
npx eas login
```

---

## 3. Verify the EAS project

Run:

```bash
npx eas project:info
```

You should see:

```text
fullName  @dhriti-infotech-expo/CareNow
ID        fb2b61f8-f502-41a7-a507-9ec241bb5c91
```

---

## 4. Verify production API configuration

Your `src/config/env.ts` should currently have:

```ts
let APP_ENV: 'dev' | 'prod' = 'prod';
```

And:

```ts
const CLOUD_API_BASE_URL = 'https://api.dhritex.com';
```

Therefore, the APK will use:

```text
https://api.dhritex.com
```

instead of the local development URL:

```text
http://192.168.1.2:8082
```

You can verify the configuration with:

```bash
grep -n "APP_ENV\|CLOUD_API_BASE_URL" src/config/env.ts
```

---

## 5. Check your APK profile

Your `eas.json` should contain:

```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

You can check the complete file with:

```bash
cat eas.json
```

---

## 6. Check the Expo configuration

Run:

```bash
npx expo config --type public
```

Make sure you see:

```text
name: CareNow
slug: CareNow
android.package: com.dhritiinfotechexpo.CareNow
```

---

## 7. Start the APK build

This is the main command:

```bash
npx eas build --platform android --profile preview
```

EAS will upload your project and start a cloud build.

You may be asked about Android credentials.

If asked:

```text
Generate a new Android Keystore?
```

Select:

```text
Yes
```

and let EAS manage the credentials.

---

## 8. Monitor the build

You can check recent builds with:

```bash
npx eas build:list --limit 5
```

EAS will also provide a build URL in the terminal.

Wait until the build status shows:

```text
Build finished
```

---

## 9. Download the APK

After the build completes, EAS provides a URL similar to:

```text
https://expo.dev/accounts/.../projects/CareNow/builds/...
```

Open that URL in your browser and download the `.apk`.

The downloaded file will be something like:

```text
CareNow.apk
```

---

## 10. Install on Android

You can send the APK to your Android phone and install it directly.

### Option A — Install manually

1. Transfer `CareNow.apk` to the Android phone.
2. Open the APK on the phone.
3. Allow installation from the requested source if Android asks.
4. Install the application.

### Option B — Install using USB/ADB

First verify that the device is connected:

```bash
adb devices
```

Then install the APK:

```bash
adb install -r ~/Downloads/CareNow.apk
```

The `-r` option reinstalls the APK while attempting to preserve the existing application data.

---

## Quick Build Checklist

Before starting the build, verify:

- [ ] You are inside the CareNow project directory.
- [ ] `npx eas whoami` shows `dhriti-infotech-expo`.
- [ ] EAS project is `@dhriti-infotech-expo/CareNow`.
- [ ] `APP_ENV` is set to `prod`.
- [ ] `CLOUD_API_BASE_URL` is `https://api.dhritex.com`.
- [ ] `eas.json` has `preview` configured with `buildType: "apk"`.
- [ ] Expo package is `com.dhritiinfotechexpo.CareNow`.
- [ ] Android credentials are available or managed by EAS.
- [ ] Run `npx eas build --platform android --profile preview`.

### Main command

Once everything is verified, the command to generate the installable APK is:

```bash
npx eas build --platform android --profile preview
```
