# Massage Booking API Repository Instructions

## Scope and precedence

- These instructions apply to the entire repository.
- Follow the user's current request first, then these repository rules, then established local patterns.
- Before changing code, read `README.md`, `package.json`, `tsconfig.json`, and the relevant route, controller, model, middleware, and tests.
- Keep work narrowly scoped. Preserve user changes and do not refactor unrelated code.
- Do not create commits, push branches, alter remotes, or rewrite Git history unless the user explicitly requests that Git action.

## Repository purpose and architecture

This repository is a backend API for massage bookings, user accounts, therapists, customers, and administrators. It uses Node.js, Express, TypeScript, MongoDB/Mongoose, JWT authentication, Joi validation, Nodemailer, Swagger UI, Winston, and Jest.

The runtime request path is:

1. `server.ts` loads environment handling and startup modules.
2. `startup/routes.ts` installs shared Express middleware and mounts API routers.
3. `routes/` declares endpoints and middleware chains.
4. `controllers/` validates requests, applies business rules, and coordinates persistence.
5. `models/` defines Mongoose schemas, discriminators, document methods, and model validation.
6. `middleware/` handles authentication, authorization, rate limiting, object IDs, and terminal error responses.

Important locations:

- `server.ts`: TypeScript runtime entry point.
- `startup/`: environment, database, logging, production middleware, routing, email transport, and scheduled jobs.
- `routes/`: thin Express routers mounted below `/api`.
- `controllers/`: request handling and application workflows.
- `models/`: Mongoose schemas and Joi request validators.
- `middleware/`: reusable request middleware.
- `types/`: project type declarations and Express augmentation.
- `tests/`: Jest tests organized to mirror source areas.
- `docs/openapi.json`: API contract served by `docs/swagger.ts`.
- `views/`: Handlebars templates.
- `scripts/`: explicit operational and migration scripts.
- `dist/`: generated build output; never edit or commit it.

## Commands

Use the existing npm scripts:

- Install dependencies: `npm install`
- Development server: `npm run dev`
- TypeScript build: `npm run build`
- Full test suite: `npm test`
- Discriminator migration: `npm run migrate:discriminators`
- Production-style start after building: `npm start`

There is currently no lint or formatting script. Do not claim lint passed and do not introduce a formatter-only rewrite. Add a dependency or new npm script only when the task requires it and explain why.

## TypeScript and module standards

- Write new runtime source in TypeScript. Do not add JavaScript counterparts to TypeScript modules.
- `server.js` is legacy source. Do not extend it; use `server.ts`.
- Preserve NodeNext ESM conventions: use `import`/`export` and include `.js` on relative imports from TypeScript.
- Keep TypeScript strict. Prefer explicit domain types, `unknown`, type guards, and narrow casts over `any`.
- Use `import type` for type-only imports.
- Type Express handlers with `Request`, `Response`, and the shared authenticated-user shape from `types/express.d.ts` where applicable.
- Account for runtime union shapes instead of assuming populated Mongoose references. In particular, `req.user.userType` may be an ID or an object containing `_id` and `name`.
- Follow the existing format: two-space indentation, double quotes, semicolons, and trailing commas in multiline constructs.
- Use descriptive camelCase names for variables/functions, PascalCase for types and Mongoose models, and the existing dotted filename convention such as `booking.controller.ts` and `booking.model.ts`.
- Add comments only for non-obvious constraints or decisions. Do not narrate straightforward code.

## Layering and implementation rules

### Routes

- Keep route files thin: declare the HTTP method/path, attach middleware, and select a controller.
- Put authentication and authorization middleware before controllers.
- Apply `validateObjectId` to path parameters that are used as MongoDB object IDs.
- Public endpoints that can be abused or trigger costly work must use `createRateLimiter` from `middleware/rateLimiter.ts`.

### Controllers

- Validate request bodies before database work and return a clear `400` response for invalid input.
- Keep business workflows and cross-model orchestration in controllers or focused domain helpers, not route files.
- Use appropriate HTTP semantics: `400` for malformed input, `401` for missing/invalid authentication, `403` for forbidden actions, `404` for missing resources, and `500` only for unexpected failures.
- Return after sending an error response so execution cannot continue.
- Do not expose passwords, tokens, secrets, internal stack traces, or unnecessary account fields.

### Models and persistence

- Keep schema definitions, discriminator setup, document methods, and model-local validation in `models/`.
- `User` is the base model. `Therapist` and `Customer` are discriminators using the `kind` discriminator key. Preserve compatibility with the explicit migration script; do not silently add startup migrations.
- Use Mongoose sessions/transactions for workflows that must update multiple documents atomically.
- Pass the session to every database read/write that participates in a transaction.
- Booking and therapist reservation data are denormalized. Any create, reschedule, reassignment, cancellation, completion, or cleanup change must keep both representations consistent and must add regression tests for partial-failure behavior.
- Before accepting an appointment, enforce therapist eligibility, availability, and time-conflict rules in server-side code. Never rely on a client-provided availability value.
- Prefer database filters that encode ownership and current state over read-then-write authorization checks where practical.

### Configuration and startup

- Load environment/config values through `startup/env.ts`; do not scatter new `process.env` access when the shared accessor applies.
- Production-required settings belong in `startup/config.ts` and must fail clearly when absent.
- Keep environment-dependent services in `startup/` and keep `server.ts` limited to composition and listening.
- Scheduled jobs must be idempotent, log failures through Winston, preserve required history, and keep related documents consistent.

## Authentication, authorization, and security

- Every protected endpoint must use `auth` middleware.
- Authentication is not authorization. Verify the current user's role and resource ownership for every read or mutation of another user's data.
- A therapist may act only on appointments assigned to that therapist unless an explicit administrator workflow says otherwise.
- A customer may read or change only that customer's appointments. Resolve ownership from the authenticated user ID; do not rely only on a client-supplied email address.
- Administrative operations must use the shared `admin` middleware.
- Never trust client-supplied `userType`, `status`, `isAdmin`, `isAvailable`, `createdBy`, or other privilege/state fields on public endpoints.
- JWTs must have an expiration and use configuration-provided secrets.
- Passwords must be hashed with the established bcrypt flow and excluded from normal queries/responses.
- Do not read secret values into output, logs, tests, fixtures, or documentation. `.env` is local-only even if Git history currently contains it; never add credentials to it as part of repository work.
- Do not weaken Helmet, CORS, rate limiting, token validation, or account-state checks to make a test pass.

## Validation and API contracts

- Use Joi for request validation and keep validators near the relevant model/controller following existing placement.
- Prefer explicit `.valid(...)` sets for enum-like fields such as status and role names.
- Validate dates, durations, and identifiers at the API boundary. Appointment logic must reject invalid ranges, past times where inappropriate, and conflicts.
- When a user-facing endpoint, payload, status code, or response changes, update `docs/openapi.json` and relevant README guidance in the same change.
- Preserve the existing JSON API style unless the task explicitly introduces a versioned contract change.

## Tests and verification

- Use Jest with ESM-compatible TypeScript tests under `tests/`.
- Mirror the source area: controller tests in `tests/controllers`, middleware tests in `tests/middlewares`, and route registration tests in `tests/routes`.
- Add regression tests for bug fixes and focused tests for new behavior, authorization boundaries, validation failures, and persistence side effects.
- Mock Mongoose query chains and documents realistically. If production code calls document methods such as `.get()`, `.save()`, or `.populate()`, the mock must model that behavior unless the code is intentionally made tolerant.
- Route tests must verify both endpoint registration and security-critical middleware where behavior depends on the chain.
- Run the narrowest relevant tests while iterating, then run `npm run build` and `npm test` before completion for runtime changes.
- If a check cannot run because MongoDB, email credentials, network access, or another external dependency is unavailable, report that limitation. Do not claim success based only on static inspection.
- If the repository has a pre-existing failing check, establish and report the baseline separately from failures introduced by the change.

## Documentation and generated files

- Keep `README.md` accurate for setup, environment variables, commands, and operator workflows.
- Treat `docs/openapi.json` as maintained source and `dist/` as generated output.
- Do not edit or commit `combined.log`, `error.log`, `.env`, `.env.*`, `node_modules/`, temporary caches, or generated `dist/` files.
- Use ASCII in new files unless existing content or user-facing text requires Unicode.

## Git and change discipline

- Inspect `git status --short` before and after work.
- Assume existing changes belong to the user. Never discard, overwrite, stage, or commit unrelated changes.
- Review the final diff for accidental secret, log, generated-output, dependency-lock, and formatting churn.
- Use concise imperative commit messages that describe one coherent change.
- Never use destructive history or worktree commands such as `git reset --hard`, forced checkout, destructive clean, rebase, or force-push unless the user explicitly requests the exact operation and its impact is understood.
- Push only when explicitly requested, after confirming the current branch, remote, included diff, and verification result.

## Completion criteria

Work is complete only when:

1. The requested behavior is implemented within the correct layer.
2. Security, ownership, validation, and denormalized-data implications were considered.
3. Relevant tests were added or updated.
4. `npm run build` and the appropriate Jest tests were run, or blockers were reported precisely.
5. API and setup documentation was updated when behavior changed.
6. The final diff contains no unrelated edits, generated output, logs, or secrets.
7. The handoff states what changed, what was verified, and any remaining risk.

## Specialized agent usage

Project-scoped custom agents live in `.codex/agents/`. Use them only for their declared roles:

- `planner`: read-only investigation and implementation planning.
- `implementer`: substantial, approved feature and refactor work.
- `debugger`: reproduce, isolate, fix, and regression-test defects.
- `reviewer`: read-only, evidence-first code review.
- `quick-implementer`: small, low-risk changes with a tightly bounded surface.
- `documenter`: documentation-only updates that record implemented behavior, verification evidence, review outcomes, and deferred risks.
- `git-integrator`: explicit commit, push, and detailed pull-request delivery after implementation, verification, and review.

When delegation is requested, give each agent a concrete bounded task, avoid concurrent edits to the same files, and require a concise evidence-based handoff. All agents must read and follow this file; role instructions narrow their scope but never override repository safety, security, or verification rules.
