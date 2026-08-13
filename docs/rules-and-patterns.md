# Rules and Patterns

This document defines the baseline conventions for this project so new components and features match the current architecture and TypeScript migration direction.

## 1. Project overview

- Runtime: Node.js + Express
- Language: TypeScript in source files
- Module system: ESM (`"type": "module"`)
- Database: MongoDB + Mongoose
- Auth: JWT-based request authentication
- API docs: Swagger UI
- Build: `tsc`
- Runtime entry: `server.ts`

## 2. Source organization

- Keep application logic in feature-oriented folders:
  - `controllers/`
  - `models/`
  - `routes/`
  - `middleware/`
  - `startup/`
  - `docs/`
- Prefer TypeScript source files over JavaScript files.
- Do not add new runtime logic to generated output under `dist/`.
- Keep configuration and environment handling in the `startup/` layer.

## 3. Import conventions

- Use ESM import syntax.
- Keep relative paths explicit.
- Use `.js` extensions in TypeScript imports because the project is configured as ESM.
  - Example: `../models/user.model.js`
- Avoid mixing CommonJS patterns (`require`) into TypeScript source files.

## 4. TypeScript rules

- Prefer typed functions and typed request/response objects.
- Do not use `any` unless there is a genuine dynamic runtime case and it is clearly justified.
- Prefer narrow checks over broad casts.
- If a value may be object-or-string-or-undefined, guard it before property access.
- Use explicit types for JWT payloads and Express request augmentation.

### Example guard pattern

```ts
const authUserType =
  typeof req.user?.userType === "object" && req.user.userType !== null
    ? req.user.userType
    : undefined;

const userTypeId = authUserType?._id;
```

## 5. Request typing pattern

Authenticated requests should use a typed request shape instead of raw `any`.

- Add shared auth types in `types/express.d.ts`.
- Keep the payload shape aligned with the JWT contents.
- Preserve runtime reality, including object/string form of `userType` when needed.

## 6. Model and Mongoose patterns

- Keep schema definitions in `models/`.
- Use Mongoose models and statics consistently.
- Use discriminators and model-level helpers only when the app already uses them.
- Do not add DB logic directly inside route files.

## 7. Routes and controllers

- Routes should remain thin and define HTTP endpoints.
- Controllers should encapsulate request validation, database logic, and response handling.
- Keep business logic in controllers or model helpers, not in middleware unless it is truly auth/validation middleware.
- Return clear status codes and simple user-facing messages.

## 8. Auth and middleware patterns

- JWT token verification should happen in middleware.
- Middleware should attach a known user payload to `req.user`.
- Auth-protected routes should rely on the typed request shape and not re-interpret raw values ad hoc.
- JWTs must always be issued with an `expiresIn` value (see `generateAuthToken` in `models/user.model.ts`). Never issue a token that lives forever; it removes the only bound on a leaked-token's blast radius.
- Never trust a client-supplied field that controls privilege or role (e.g. `userType`, `isAdmin`, `status`) on a public/unauthenticated endpoint. Resolve privilege-sensitive fields server-side only, even if the request body technically allows the field (see `registerCustomer`, which always forces the `customer` user type regardless of request body).

## 9. Rate limiting patterns

- Every public, unauthenticated endpoint that triggers a costly or abusable action (login, registration, email sending, password reset) must be rate limited.
- Use the shared factory in `middleware/rateLimiter.ts` (`createRateLimiter`) instead of configuring `express-rate-limit` inline per route, so IPv6-safe key generation (`ipKeyGenerator`) stays consistent everywhere.
- Apply the limiter at the router level with `router.use(...)` or directly on the route, before the controller.

## 10. Validation patterns

- Validate incoming request bodies using Joi schemas near the relevant model or controller.
- Fail fast with `400` for invalid payloads.
- Keep validation logic readable and local to the feature it validates.

## 11. Environment and config

- Do not store secrets in source files.
- Export required environment variables in the shell or use a local `.env` file ignored by Git.
- `.env` (and any `.env.*` variant except `.env.example`) must always be listed in `.gitignore`. If a secret-bearing file is ever committed, treat every value in it as compromised and rotate the secrets, even after removing the file from tracking.
- Read config values centrally from `startup/env.ts`.
- Keep startup configuration in `startup/` and fail gracefully if required settings are missing.

## 12. Startup and server conventions

- `server.ts` is the entry point.
- Startup modules in `startup/` should configure logging, DB, routes, middleware, Swagger, and environment-driven services.
- Keep port selection and startup retry logic in the server bootstrap.

## 13. Build and verification

Before finishing feature work:

- run `npm run build`
- if the feature impacts runtime behavior, run a quick API smoke test
- validate the app still starts cleanly on the chosen port

## 14. When adding new features

For each new feature or component:

1. Place logic in the correct layer
2. Use TypeScript types
3. Validate the request payload
4. Reuse existing middleware and auth conventions
5. Add or update Swagger docs when the endpoint is user-facing
6. Run the project build before finishing

## 15. Do not do this

- Do not add secrets directly to the repo
- Do not commit generated `dist/` output
- Do not bypass auth middleware for protected routes
- Do not keep multiple duplicate config patterns across files
- Do not leave unused JS copies when the TypeScript version is the source of truth
- Do not trust client-supplied role/privilege fields on public endpoints
- Do not add a new public endpoint without a rate limiter
- Do not issue a JWT without an expiration

## 16. Naming conventions

- Prefer descriptive names over short ambiguous variables.
- Use `authUserType` for token payload values and `userTypeDoc` for database documents.
- Keep naming consistent across the same feature.
- Avoid reusing the same variable name for different meanings in the same scope.
