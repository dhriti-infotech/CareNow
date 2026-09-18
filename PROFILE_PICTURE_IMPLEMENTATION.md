# CareNow Profile Picture

Profile picture updates are available after account/profile creation for both USER and PROFESSIONAL accounts.

## Frontend

- Tap the profile avatar on either profile screen.
- Choose **Take Photo** or **Choose from Gallery**.
- Image is cropped to a square before upload.
- The selected image is uploaded as multipart form data.
- The profile image is displayed from the authenticated backend endpoint.
- No registration/create-profile flow was changed.

Install the Expo dependency with the SDK-matched command:

```bash
npx expo install expo-image-picker
```

Then rebuild the native app when using the config plugin:

```bash
npx expo run:android
# or
npx expo run:ios
```

## Backend

User endpoints:

```text
PUT /api/user/patient/profile-picture
GET /api/user/patient/profile-picture
```

Professional endpoints:

```text
PUT /api/professional-auth/profile-picture
GET /api/professional-auth/profile-picture
```

The endpoints use the authenticated JWT identity and never accept an account/profile ID from the client.

Images are stored in PostgreSQL as BYTEA with their MIME type. Maximum upload size is 5 MB. Supported types are JPEG, PNG, WEBP, HEIC and HEIF.

Migration:

```text
V16__add_profile_pictures.sql
```

Existing profile creation/registration code is unchanged.
