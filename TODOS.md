# TODOs

## Security review & Row-Level Security (RLS)

- [ ] **Run a security review** before shipping. Things to verify: `/api/checkout`
      rejects unauthenticated requests (401), Zod validation rejects malformed
      input, no secrets are logged or returned in responses, session cookies are
      `HttpOnly`/`SameSite`, and dependencies are up to date. (The `/security-scan`
      skill can audit most of this.)
- [ ] **Consider Postgres Row-Level Security (RLS) as defense-in-depth.** Today,
      access control is enforced only at the application layer — the route handler
      checks the session and scopes queries by `userId`. RLS would enforce
      per-user isolation at the database level, so an application bug (a missing
      `WHERE userId = ...`) still couldn't leak another user's `checkout` /
      `checkout_item` rows. To adopt it:
  - Enable RLS on `checkout` and `checkout_item` and add policies keyed to the
    current user id.
  - Note: the Neon serverless (HTTP) driver doesn't hold a session, so
    `SET LOCAL` / `current_setting()` per-request context needs care — evaluate
    Neon's "Authorize" / RLS-with-JWT approach, or pass the user id explicitly
    into policies.
  - Decide whether RLS is worth the added complexity for this service, or whether
    application-layer scoping + tests is sufficient.
