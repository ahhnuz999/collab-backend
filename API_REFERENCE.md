# ResQ Backend API Reference

Base URLs:

- Modern API: `http://<host>:<port>/api`
- Legacy API: `http://<host>:<port>/api/v1`

Development startup note:

- If the preferred port is busy, the backend may start on the next available port during development.
- Always use the exact host and port printed in the server logs when connecting the frontend.

Unless noted otherwise, requests use `Content-Type: application/json`.

Protected routes accept either:

- `Authorization: Bearer <token>`
- Cookie: `token`

## Current Auth Flow

For the current app behavior:

- Register does not require OTP verification.
- Login does not require OTP verification.
- OTP verification is only used for forgot-password.

Recommended client flow:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. If the user forgets their password:
4. `POST /api/auth/forgot-password`
5. `POST /api/auth/reset-password`

## Root

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Returns API metadata and base URLs |

## Modern API

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a user and return JWT plus user payload |
| POST | `/api/auth/login` | No | Login with `phoneNumber` and `password`; returns JWT plus user payload |
| POST | `/api/auth/forgot-password` | No | Send reset OTP to the user's email and return `userId` |
| POST | `/api/auth/reset-password` | No | Verify OTP and set a new password |

Register request:

```json
{
  "name": "Ava Singh",
  "phoneNumber": "9812345678",
  "email": "ava@example.com",
  "password": "StrongPass1!",
  "primaryAddress": "Kathmandu",
  "age": 27,
  "medicalInfo": {
    "bloodGroup": "O+",
    "allergies": ["Penicillin"],
    "conditions": ["Asthma"],
    "medications": ["Inhaler"],
    "notes": "Carries rescue inhaler"
  }
}
```

Register notes:

- Required fields: `name`, `phoneNumber`, `email`, `password`, `primaryAddress`, `age`
- `phoneNumber` is used as the login identifier
- `password` must be at least 8 characters
- Successful register returns a JWT token immediately

Login request:

```json
{
  "phoneNumber": "9812345678",
  "password": "StrongPass1!"
}
```

Login notes:

- Login uses `phoneNumber`, not `email`
- Successful login returns a JWT token immediately

Forgot-password request:

```json
{
  "email": "ava@example.com"
}
```

Forgot-password success shape:

```json
{
  "statusCode": 200,
  "message": "Password reset OTP sent successfully",
  "data": {
    "userId": "user-uuid"
  },
  "success": true
}
```

Reset-password request:

```json
{
  "userId": "user-uuid",
  "otpToken": "123456",
  "password": "NewStrongPass1!"
}
```

Reset-password notes:

- OTP expires in about 10 minutes
- Use the `userId` returned by forgot-password
- OTP is sent to the email stored for that user

### Users (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/profile` | user, admin | Get current user profile |
| PUT | `/api/users/profile` | user, admin | Update current user profile |
| GET | `/api/users` | admin | List users |
| GET | `/api/users/:id` | admin | Get a user by id |
| GET | `/api/users/:id/contacts` | user, admin | Get a user's emergency contacts |
| GET | `/api/users/:id/requests` | user, admin | Get a user's emergency requests |
| GET | `/api/users/:id/responses` | admin | Get a user's emergency responses |

### Contacts (`/api/contacts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contacts` | user, admin | Create contact |
| GET | `/api/contacts` | user, admin | List contacts |

### Emergency (`/api/emergency`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/emergency/sos` | user, admin | Create SOS alert |
| GET | `/api/emergency/history` | user, admin | Get incident history |
| GET | `/api/emergency/:id` | user, admin | Get emergency by id |
| PUT | `/api/emergency/:id/status` | user, admin | Update emergency status |

### Admin (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/emergencies/active` | admin | List active emergencies |
| POST | `/api/admin/emergencies/:id/assign` | admin | Assign a service provider |

## Legacy API

### App-level

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users` | No | Lists all users; currently public |

### Health (`/api/v1/healthcheck`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/healthcheck` | No | Health check |

### User (`/api/v1/user`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/user/register` | No | Register user |
| POST | `/api/v1/user/login` | No | Login with `phoneNumber` and `password` |
| GET | `/api/v1/user/logout` | user, admin | Logout |
| PUT | `/api/v1/user/update` | user, admin | Update user |
| POST | `/api/v1/user/verify` | No | Legacy account verification endpoint |
| POST | `/api/v1/user/forgot-password` | No | Accepts `email` or `phoneNumber`; sends OTP to email |
| POST | `/api/v1/user/reset-password` | No | Reset password with `otpToken`, `userId`, and `password` |
| POST | `/api/v1/user/change-password` | user | Change password while logged in |
| GET | `/api/v1/user/profile` | user | Get current user profile |
| POST | `/api/v1/user/update-push-token` | user | Update push token |
| GET | `/api/v1/user/:userId` | No | Get user by id |

Legacy user notes:

- The legacy verify route still exists for backward compatibility
- The intended current app flow is still no OTP on register/login
- Forgot-password remains the OTP-based verification path

### Service Provider (`/api/v1/service-provider`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/service-provider/register` | admin | Create service provider credentials |
| POST | `/api/v1/service-provider/login` | No | Login service provider |
| POST | `/api/v1/service-provider/verify` | No | Verify service provider |
| POST | `/api/v1/service-provider/forgot-password` | No | Send forgot-password OTP |
| POST | `/api/v1/service-provider/reset-password` | No | Reset password with OTP |
| GET | `/api/v1/service-provider/nearby` | No | Get nearby providers |
| POST | `/api/v1/service-provider/logout` | service provider | Logout |
| GET | `/api/v1/service-provider/profile` | service provider | Get profile |
| PATCH | `/api/v1/service-provider/update` | service provider | Update profile |
| DELETE | `/api/v1/service-provider/delete` | service provider | Delete |
| POST | `/api/v1/service-provider/change-password` | service provider | Change password |
| GET | `/api/v1/service-provider/:id` | service provider | Get by id |
| PATCH | `/api/v1/service-provider/status` | service provider | Update status |

### Organization (`/api/v1/organization`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/organization` | No | Create organization |
| GET | `/api/v1/organization` | admin | List organizations |
| GET | `/api/v1/organization/:id` | No | Get organization by id |
| PUT | `/api/v1/organization/:id` | admin | Update organization |
| DELETE | `/api/v1/organization/:id` | admin | Delete organization |

### Emergency Request (`/api/v1/emergency-request`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/emergency-request` | user | List current user's requests |
| POST | `/api/v1/emergency-request` | user | Create request |
| GET | `/api/v1/emergency-request/recent` | user | Get recent requests |
| GET | `/api/v1/emergency-request/:id` | No | Get request by id |
| PUT | `/api/v1/emergency-request/:id` | No | Update request |
| DELETE | `/api/v1/emergency-request/:id` | admin | Delete request |

### Emergency Response (`/api/v1/emergency-response`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/emergency-response` | user | Create response |
| GET | `/api/v1/emergency-response/provider-responses` | service provider | Get provider responses |
| GET | `/api/v1/emergency-response/:id` | No | Get response by id |
| PUT | `/api/v1/emergency-response/:id` | No | Update response |
| DELETE | `/api/v1/emergency-response/:id` | admin | Delete response |

### Maps (`/api/v1/maps`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/maps/autocomplete` | user, admin | Place autocomplete |
| GET | `/api/v1/maps/optimal-route` | user, admin | Route lookup using query params |

Required route query params for `/api/v1/maps/optimal-route`:

- `srcLat`
- `srcLng`
- `dstLat`
- `dstLng`

Optional query params:

- `mode`

### Feedback (`/api/v1/feedback`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/feedback` | user | Create feedback |
| GET | `/api/v1/feedback` | user | List current user's feedback |
| GET | `/api/v1/feedback/:id` | No | Get feedback by id |
| PUT | `/api/v1/feedback/:id` | user, admin | Update feedback |
| DELETE | `/api/v1/feedback/:id` | admin, user | Delete feedback |

### Emergency Contacts (`/api/v1/emergency-contacts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/emergency-contacts` | user | Create emergency contact |
| GET | `/api/v1/emergency-contacts` | user | List emergency contacts |
| GET | `/api/v1/emergency-contacts/common/all` | No | List common contacts |
| GET | `/api/v1/emergency-contacts/:id` | No | Get contact by id |
| PUT | `/api/v1/emergency-contacts/:id` | user | Update contact |
| DELETE | `/api/v1/emergency-contacts/:id` | user, admin | Delete contact |

### Notifications (`/api/v1/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/notifications` | user | List notifications |
| POST | `/api/v1/notifications` | user | Create or fetch notifications, depending on controller behavior |
| PUT | `/api/v1/notifications/:id/read` | user | Mark notification as read |
| POST | `/api/v1/notifications/token` | user | Register notification token |

## Error Format

Validation and application errors follow this general shape:

```json
{
  "success": false,
  "message": "Human-readable message",
  "errors": [],
  "data": null
}
```

In development mode, a `stack` field may also be included.

## Email and Environment Setup

Forgot-password OTP emails use Gmail SMTP through:

- `GOOGLE_MAIL`
- `GOOGLE_PASS`

Important:

- `GOOGLE_PASS` should be a Gmail App Password, not the normal Gmail account password
- OTP email issues are usually unrelated to MongoDB or Atlas connectivity

Other commonly required env vars include:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET`
- `OTP_SECRET`
- `PORT`
- `HOST`

## Client Notes

- Prefer `/api/auth/*` for new app clients
- Use `phoneNumber` for login, not `email`
- Register and login return JWT immediately
- Forgot-password is the only OTP verification flow in the current app behavior
- In local development, confirm the backend's actual runtime port from the startup logs before pointing the frontend at it
