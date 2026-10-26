# LifeVault Progress

Last updated: 2026-10-26

## Done

### Core app (before 2026-10-26)
- [x] Signup and login with bcrypt password hashing and a 7-day JWT
- [x] Session restore on app start (`/authme`), token sent by the HTTP interceptor
- [x] Receipt upload (JPG, PNG, WEBP, PDF, max 10 MB) with Gemini field extraction
- [x] Review form, then save the item with its document attached
- [x] My Vault: search, category and warranty-status filters, pagination, preview and download
- [x] AI Assistant: plain-language questions turned into a safe, user-scoped database query
- [x] Backend deployed to Vercel as a serverless function; frontend points to the deployed API
- [x] Fixes: upload folder on Vercel (`/tmp`), `documentId` in the AI controller

### UI, routing and validation (2026-10-26, merged into `main` in `5ca0dad`)
- [x] Footer links work (`RouterLink` was missing)
- [x] New Privacy Policy (`/privacy`) and Terms of Use (`/terms`) pages
- [x] Page scrolls to the top on navigation
- [x] Header: active page highlighted, Dashboard link fixed
- [x] Header: profile dropdown (avatar, name, quick links, Log out) replaces the old Logout button
- [x] Login validation: email format, required password, server error shown, loading state fixed
- [x] Signup validation: username rules, email format, strong password, confirm password, "email already exists" shown
- [x] Show/hide password button on both forms

### Reverted
- [ ] ~~About page (`/about`) and client test fixes~~: merged in `7168dc2`, reverted in `c8d49b3`. Still on branch `feature/ui-routing-validation`.

### Docs
- [x] Project overview document
- [x] `CLAUDE.md` written (not committed yet)

## Ready for testing: profile settings and email two-factor authentication (2FA)

On branch `feature/ui-routing-validation`, not merged into `main`.

From the profile dropdown in the header, the user opens **Settings**. There they can change their password and turn 2FA on or off. When 2FA is on, login emails a 6-digit code that must be entered after the password.

### Decisions made (2026-10-26)
- 2FA method: **email code** (uses the Gmail SMTP settings in `server/.env`).
- Changing the password **signs out all other devices**; the current device gets a new token.
- Turning 2FA off needs the password only.

### Backend (`server/`)
- [x] User model: `twoFactorEnabled`, `tokenVersion`, `twoFactorCode` (hashed, hidden)
- [x] Server-side signup validation matching the client rules
- [x] `GET /api/auth/me`: profile for the Settings page
- [x] `PUT /api/auth/password`: checks the current password and new rules, signs out other devices, emails an alert
- [x] `POST /api/auth/2fa/enable/request` and `/2fa/enable/confirm`: email a code, then turn 2FA on
- [x] `POST /api/auth/2fa/disable`: needs the password
- [x] Login returns a 10-minute `tempToken` when 2FA is on; `POST /api/auth/2fa/verify` exchanges it plus the code for a session
- [x] `POST /api/auth/2fa/resend`: new code, 60-second cooldown
- [x] Codes expire after 10 minutes, lock after 5 wrong tries, work once, and only for their purpose (login or enable)
- [x] Auth middleware rejects pending-2FA tokens and tokens from before a password change; token logging removed
- [x] Fixed `email.service.js` (it crashed when imported)
- [x] Fixed local startup (`.env` now loads from `config/env.js` before other imports)
- [x] End-to-end API check: 24/24 passed against the local server with real Gmail sending

### Frontend (`client/`)
- [x] **Settings** item in the header profile dropdown
- [x] `/settings` page: account details, change password, 2FA on/off with status badge
- [x] Login: second step for the emailed code, with resend and "use a different account"
- [x] `environments/` files: `npm start` uses `http://localhost:8000`, production build uses the Vercel API
- [x] Client tests fixed and extended: 29/29 passing

### Still open
- [ ] Test in the browser, then merge into `main` after approval
- [ ] Deploy the backend: add the `SMTP_*` and `FROM` variables in Vercel before merging
- [ ] No rate limit on wrong passwords at login yet (2FA codes are limited)
- [ ] Optional: backup codes in case the user loses access to their email
