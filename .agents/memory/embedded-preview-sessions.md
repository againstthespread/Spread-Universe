---
name: Embedded preview sessions
description: Browser-cookie requirements for session authentication inside Replit's embedded preview.
---

Session cookies used inside the Replit preview must be issued for the proxied HTTPS request with cross-site and partitioned-cookie support. Logout must expire the cookie using matching partition attributes.

**Why:** A valid login returned success, but the browser rejected the non-partitioned iframe cookie and the immediate session check returned unauthorized. Command-line cookie jars did not expose the browser-specific failure.

**How to apply:** When changing Express session configuration, preserve trusted-proxy handling, secure HTTPS detection, `SameSite=None`, and `Partitioned`. Verify through the public preview origin, including login, immediate session lookup, restart persistence, and logout removal.