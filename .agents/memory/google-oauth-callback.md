---
name: Google OAuth callback
description: Exact callback URL behavior for Google sign-in in the Replit-hosted Tebaqi app.
---

Google OAuth treats the callback URI as an exact string. The browser authorization request and server token exchange must send the same deployed web origin plus `/login`, and that exact URL must be registered in Google Cloud Console. Replit preview domains can change, so the configured Google redirect entry may need updating when the app domain changes.

**Why:** A mismatch produces Google's `redirect_uri_mismatch` error before the application receives the authorization code.

**How to apply:** When debugging Google sign-in, first compare the browser's callback URL, the server exchange value, and Google's Authorized redirect URI entry character-for-character.