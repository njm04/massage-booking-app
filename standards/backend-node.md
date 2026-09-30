# Backend Node Standards

- Keep routing thin and business logic in service/controller layers.
- Validate request payloads before persistence operations.
- Use clear HTTP status semantics and stable response shapes.
- Guard privileged operations with role/ownership checks.
- Handle async errors explicitly and log safely.
