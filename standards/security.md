# Security Standards

- Treat all external input as untrusted and validate at boundaries.
- Enforce authentication and authorization for protected operations.
- Do not expose secrets, tokens, passwords, or internal stack traces.
- Use least-privilege defaults and explicit allowlists when possible.
- Preserve existing protections (rate limiting, headers, sanitization).
