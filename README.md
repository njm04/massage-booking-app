# Massage Booking App

A Node.js + Express API for managing massage bookings, user accounts, therapists, and customer flows.

## Features

- User registration and authentication
- JWT-based protected routes
- Email confirmation flow
- Booking creation and status updates
- Therapist and customer role logic
- Swagger API documentation
- MongoDB-backed persistence

## Tech stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Joi for validation
- JWT for auth
- Nodemailer for email
- Swagger UI for docs
- Winston for logging

## Project structure

- `controllers/` — request handlers and business logic
- `models/` — Mongoose schemas and validation
- `routes/` — API route definitions
- `middleware/` — auth and request validation middleware
- `startup/` — app bootstrap and environment setup
- `docs/` — generated docs and project guidance
- `views/` — Handlebars templates for email or UI responses
- `dist/` — generated build output (do not edit manually)

## Requirements

- Node.js 18+
- MongoDB running locally or reachable via connection string
- Git Bash / terminal for environment exports

## Environment variables

Set the following values in your shell before starting the app:

```bash
export PORT=5000
export booking_jwtPrivateKey="your-jwt-secret"
export booking_ATLAS_DB="your mongoDB connection string here"
export booking_email="your-email@example.com"
export booking_emailPassword="your-email-password"
export booking_emailSecret="your-email-secret"
```

You may also use a local `.env` file if preferred, but do not commit secrets.

## Install dependencies

```bash
npm install
```

## Development/build

### Build TypeScript

```bash
npm run build
```

### Start the app

```bash
npm start
```

### Run in dev mode

```bash
npm run dev
```

### Migrate discriminator records

Run this once if existing therapist or customer records use Mongoose's old `__t` field or are missing the current `kind` discriminator field. The migration is idempotent and does not run automatically when the server starts.

PowerShell:

```powershell
$env:booking_ATLAS_DB = "your MongoDB connection string"
npm run migrate:discriminators
```

Bash:

```bash
export booking_ATLAS_DB="your MongoDB connection string"
npm run migrate:discriminators
```

If `booking_ATLAS_DB` is already in your local `.env` file, run only:

```bash
npm run migrate:discriminators
```

The script finds therapist and customer users, sets the matching `kind` value, removes the obsolete `__t` field, and initializes missing therapist `isAvailable` and `reservations` fields without overwriting existing values. It does not change customer verification fields. Review the reported counts, then restart the API and retry user lookups.

## API docs

Swagger UI is exposed at:

```text
http://localhost:5000/api-docs
```

## Typical app flow

1. Start MongoDB
2. Export required environment variables
3. Run `npm run build`
4. Start the app with `npm start`
5. Review routes in Swagger
6. Register/login via API endpoints under `/api`

## Notes

- The project is in a TypeScript migration phase, so keep new code in TypeScript and avoid reintroducing JS-only source files unless there is a clear reason.
- Prefer the project conventions in `docs/rules-and-patterns.md` when adding new features.
- Do not commit secrets, generated build output, or local environment files.

## Useful commands

```bash
npm run build
npm start
npm run dev
```

## Common troubleshooting

- If port 5000 is in use, stop the old listener or change the exported `PORT` variable.
- If MongoDB fails to connect, confirm the `booking_ATLAS_DB` value is valid.
- If auth fails, confirm `booking_jwtPrivateKey` matches the token secret used during login.
- If Swagger is not showing properly, confirm the app is running and the route middleware is mounted.
