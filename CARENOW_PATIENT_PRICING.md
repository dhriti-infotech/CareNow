# CareNow Patient Service Pricing

## What changed
- Patient Nurse-at-Home request screen loads prices from the backend.
- Each care option displays its current server-side price.
- The selected price is used when creating the nurse request.
- The request button shows the selected service price.
- The app does not fall back to a hardcoded price when pricing cannot be loaded.
- Backend validates the submitted price against the current configured price to prevent client-side tampering.

## API
`GET /api/user/patient/service-pricing`

Returns active nurse service pricing records in INR.

## Initial pricing
The Flyway migration initializes the four currently supported Nurse-at-Home care options to INR 500.00 because the existing request flow used INR 500.00. These values are stored in `nurse_service_pricing` and can be changed server-side without changing the mobile app.
