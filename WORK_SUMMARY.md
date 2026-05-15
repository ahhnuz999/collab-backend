# Emergency Request Flow Work Summary

Date: 2026-05-15

## What Changed

- Removed the Rescue Team option from the user-facing emergency buttons and service-request screen.
- Removed old hardcoded user request history from the dashboard.
- Removed old hardcoded admin request data from the admin dashboard.
- Connected the user dashboard history to real backend request history from MongoDB.
- Connected the admin dashboard to real backend emergency requests.
- Admin dashboard now polls for live requests every 15 seconds while the admin is available.
- Admin availability now controls request visibility:
  - Available/busy admins can load requests.
  - Unavailable admins clear the queue and do not fetch requests.
- Admin Accept now calls the backend approve endpoint.
- Admin Decline now calls the backend reject endpoint.
- Admin Complete now calls the backend resolve endpoint.
- Created and registered a MongoDB `user_request_history` collection.
- Backfilled existing emergency requests into `user_request_history`.
- Added a repeatable organization seeding script.

## MongoDB Work

Database: `emerg`

Collections confirmed:
- `emergencyrequests`
- `user_request_history`

Backfill result:
- `13` existing emergency requests were copied into user history.

Seeded/updated official organizations:
- Ambulance: `102`
- Nepal Police: `100`
- Fire Brigade: `101`

Seed script:
- `scripts/seed-official-organizations.js`

## Main Files Changed

Backend:
- `src/db/models.js`
- `src/services/user-history.service.js`
- `src/controllers/emergency-request.controller.js`
- `src/controllers/emergency-api.controller.js`
- `scripts/seed-official-organizations.js`

Frontend:
- `emerg-frontend/src/lib/auth.ts`
- `emerg-frontend/src/lib/app-preferences.tsx`
- `emerg-frontend/app/dashboard.tsx`
- `emerg-frontend/app/service-request.tsx`
- `emerg-frontend/app/admin-dashboard.tsx`

## Behavior Now

1. User sends ambulance, police, or fire rescue request.
2. Backend creates a real emergency request.
3. Backend writes/updates the matching `user_request_history` document.
4. User dashboard shows the real request in Recent Requests.
5. Admin dashboard fetches active backend emergencies while available.
6. Admin can accept or decline the real request.
7. Accepted/rejected/resolved statuses are written back to MongoDB and reflected in history.

## Verification

Passed:
- `node --check src/db/models.js`
- `node --check src/services/user-history.service.js`
- `node --check src/controllers/emergency-request.controller.js`
- `node --check src/controllers/emergency-api.controller.js`
- `node --check scripts/seed-official-organizations.js`
- `npx tsc --noEmit`
- `npm run lint`

Mongo connection and collection creation passed:
- Connected to database `emerg`
- Confirmed `user_request_history`
- Seeded police/fire organizations

## Follow-up Fixes

- Admin request cards now show the user's problem message preview.
- Admin can tap `View full details` on an incoming request to open a full-screen readable detail view with requester, readable location, time, and the complete long message.
- User and admin request locations now prefer `locationName`, then the user's registered address, then coordinates only as a final fallback.
- New emergency requests store `locationName` when reverse geocoding is available.
- If reverse geocoding is unavailable or the local token is `dummy`, the backend stores the user's registered address as the readable area.
- Existing request records were backfilled with readable location names/registered addresses: `14/14`.
- User request history cards now include a `Cancel` button for active requests.
- Added real user cancellation endpoint: `POST /api/v1/emergency-request/:id/cancel`.
- Cancelled requests are removed from the admin active queue.
- Added repeatable location backfill script: `scripts/backfill-location-names.js`.

## Emergency Number Sources

Emergency numbers were verified against current public sources before seeding:
- Nepal Police: `100`
- Fire support / Fire Brigade: `101`
- Ambulance support: `102`
