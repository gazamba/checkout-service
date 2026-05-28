import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/features/auth/auth";

// Better Auth's catch-all endpoint. Handles the OAuth callback
// (/api/auth/callback/github), the client session endpoint, etc. This is auth
// framework plumbing — distinct from the single /api/checkout business route.
export const { GET, POST } = toNextJsHandler(auth);
