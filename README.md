# QuickFix Home — Appliance Repair Booking Platform

React + Vite + Bootstrap 5 frontend · Node.js + Express + MongoDB (Mongoose) backend · JWT (httpOnly cookie) auth · role-based access for **customer / technician / admin**.

```
quickfix-home/
├── client/                 React app (Vite)
│   ├── .env.example        public frontend settings
│   ├── .env.mock           demo-mode switch (npm run dev:mock)
│   └── src/
│       ├── api/            client.js (axios), endpoints.js, mockAdapter.js (DEMO ONLY)
│       ├── data/           mockData.js (DEMO ONLY — fake records)
│       ├── components/     Logo, Navbar, Footer, ApplianceIcon, OtpInput, FormFields, ui.jsx …
│       ├── context/        AuthContext (session), AreaContext (service area)
│       ├── layouts/        PublicLayout, AuthLayout, DashboardShell, RoleLayouts
│       ├── routes/         guards.jsx (ProtectedRoute, GuestOnly)
│       ├── pages/public    Home, Legal, NotFound
│       ├── pages/auth      Login, Register, VerifyOtp, ForgotPassword, ResetPassword
│       ├── pages/customer  Dashboard, Profile, BookService, MyBookings, MyAddresses,
│       │                   MyInvoices, PaymentHistory, MyReviews, Support
│       ├── pages/technician TechnicianJobs
│       ├── pages/admin     AdminDashboard, AdminTechnicians, AdminCustomers, AdminServices
│       └── styles/theme.css  navy #0B1F3A · teal #0D9488 · light #F8FAFC
└── server/                 Express API
    ├── .env.example
    ├── scripts/smoke-test.js   44-check end-to-end API test
    └── src/
        ├── config/         env.js (validated config), db.js
        ├── models/         User, OTPVerification, Service, Address, Booking, Quotation,
        │                   Invoice, Payment, Review, SupportTicket, Counter
        ├── middleware/     auth.js (protect, authorize), validate.js (zod),
        │                   rateLimiters.js, errorHandler.js
        ├── validators/     schemas.js (every request body/query/param)
        ├── services/       otp.service.js, notify.service.js (email/SMS), invoicePdf.service.js
        ├── controllers/    auth, user, service, address, booking, quotation,
        │                   technician, payment, invoice, review, support, admin
        ├── routes/         auth.routes.js, index.js
        ├── seed/seed.js    services + first admin
        ├── app.js          helmet, CORS, rate limit, sanitize, routes, errors
        └── server.js       start + graceful shutdown
```

---

## 1. Requirements

- Node.js **20 or newer**
- MongoDB 6+ (local, Docker, or a free MongoDB Atlas cluster)
- For real OTPs: an SMTP account (Gmail App Password, Brevo, Zoho, SES) **and/or** an SMS provider (Fast2SMS or Twilio)
- For online payment: a Razorpay account (test keys are fine to start)

## 2. Install

```bash
# backend
cd server
npm install
cp .env.example .env        # then fill it in (see section 3)

# frontend
cd ../client
npm install
cp .env.example .env
```

## 3. Configure `server/.env`

Generate the three secrets (run three times, use different values):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Minimum to start: `MONGODB_URI`, `JWT_SECRET`, `OTP_HMAC_SECRET`, `RESET_TOKEN_SECRET`.
The server refuses to start if a secret is missing, shorter than 32 characters, or reused.

OTP delivery (registration and password reset **do not work** without one of these):

| Option | Settings |
|---|---|
| Email (easiest) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| SMS – Fast2SMS | `SMS_PROVIDER=fast2sms`, `FAST2SMS_API_KEY` |
| SMS – Twilio | `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Local development only | `DEV_LOG_OTP=true` prints the code in the server console. Blocked when `NODE_ENV=production`. |

> India: sending commercial SMS needs **DLT registration** (entity + template) with your operator. This takes days. Start with email OTP.

Online payment: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Without them, “Pay Online” returns a clear 503 and customers pay cash.

First admin: set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` (10+ chars), then run the seed.

## 4. Run

```bash
# terminal 1 — API on http://localhost:5000
cd server
npm run seed      # creates the 6 services + first admin (safe to re-run)
npm run dev

# terminal 2 — website on http://localhost:5173
cd client
npm run dev
```

Check the API: open `http://localhost:5000/api/health` — it shows DB status and which OTP channels are ON.

**Demo mode (no backend):** `cd client && npm run dev:mock`. Uses fake data from `src/data/mockData.js`, shows a yellow banner, demo OTP is `123456`. Use it only to review the UI.

## 5. Mock vs live — what is what

| Thing | Demo mode (`VITE_USE_MOCK=true`) | Live mode |
|---|---|---|
| Data | `mockData.js`, in browser memory, lost on reload | MongoDB |
| OTP | fixed `123456`, nothing sent | real 6-digit code via email/SMS, hashed in DB |
| Login | any password, picks user by role tab | bcrypt check + JWT cookie |
| Payments | online pay disabled | Razorpay order + signature verification, cash recorded by technician |
| Invoice PDF | disabled | generated by the server (pdfkit) |
| Home page reviews | sample text from the design sheet | real reviews from completed bookings |

Everything outside `mockAdapter.js` and `mockData.js` is live code. Delete those two files and the `USE_MOCK` lines in `client.js` if you never want demo mode.

## 6. Booking lifecycle

```
customer books ─► pending ─► admin assigns technician ─► assigned
  ─► technician "Start Job" ─► in_progress
  ─► technician sends quotation ─► customer accepts (or rejects → new quotation)
  ─► technician "Mark Completed" ─► completed + invoice created (from accepted quotation)
  ─► customer pays online (Razorpay) OR technician records cash ─► invoice paid
  ─► customer writes review (once per booking)
Customer can cancel while pending/assigned.
```

## 7. API reference

Base URL `/api`. Auth = httpOnly cookie `qf_token` (or `Authorization: Bearer <jwt>` for API tools). Errors are `{ message, details? }`; validation errors include `details.fields`.

### Auth (public, rate-limited)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /auth/register | fullName, phone, email, password | creates unverified customer, sends OTP |
| POST | /auth/verify-otp | identifier, purpose (`register`/`reset`), code | register → sets cookie, returns user; reset → returns `resetToken` (15 min, single use) |
| POST | /auth/resend-otp | identifier, purpose | 60 s cooldown, max 5 per hour |
| POST | /auth/login | identifier (phone or email), password, role, rememberMe | 403 `NOT_VERIFIED` → go to OTP page |
| POST | /auth/forgot-password | identifier | same reply whether or not account exists |
| POST | /auth/reset-password | resetToken, password | logs out every device |
| POST | /auth/logout | – | clears cookie |
| GET | /auth/me | – | any logged-in role |

### Customer (role `customer`)
| Method | Path | Notes |
|---|---|---|
| PATCH | /users/me | `{ fullName }` (any role) |
| PATCH | /users/me/password | `{ currentPassword, newPassword }` (any role) |
| GET/POST | /addresses | max 10, first becomes default |
| PATCH/DELETE | /addresses/:id | own addresses only |
| PATCH | /addresses/:id/default | |
| POST | /bookings | serviceId, addressId, scheduledDate (YYYY-MM-DD, today…+30 days), timeSlot, issueDescription |
| GET | /bookings/mine | ?status=pending\|assigned\|in_progress\|completed\|cancelled\|active&page&limit |
| GET | /bookings/stats | totals + amount spent |
| GET | /bookings/:id | customer (own), assigned technician, admin |
| PATCH | /bookings/:id/cancel | `{ reason }` |
| PATCH | /quotations/:id/respond | `{ action: accept\|reject }` |
| GET | /invoices/mine | |
| GET | /invoices/:id/pdf | owner, assigned technician, admin |
| GET | /payments/mine | ?method=razorpay\|cash |
| POST | /payments/razorpay/order | `{ invoiceId }` — amount taken from DB |
| POST | /payments/razorpay/verify | Razorpay handler response — HMAC checked with secret |
| GET | /reviews/mine · POST /reviews | review only completed, own, once |
| GET/POST | /support/tickets/mine · /support/tickets | |

### Technician (role `technician`)
| Method | Path | Notes |
|---|---|---|
| GET | /technician/jobs | ?status= ; includes latest quotation + invoice |
| PATCH | /technician/jobs/:id/status | `in_progress` or `completed` (needs accepted quotation) |
| POST | /quotations | bookingId, items[{description, amount}], note — total computed on server |
| POST | /payments/cash | `{ invoiceId }` — only for own jobs (admin also allowed) |

### Admin (role `admin`)
| Method | Path | Notes |
|---|---|---|
| GET | /admin/stats | customers, technicians, bookings by status, revenue |
| GET | /admin/users | ?role=&page&limit |
| POST | /admin/technicians | creates verified technician |
| PATCH | /admin/users/:id/status | `{ isActive }` — disabling logs them out |
| GET | /admin/bookings | ?status= |
| PATCH | /admin/bookings/:id/assign | `{ technicianId }` |
| GET | /admin/services · PATCH /admin/services/:id | prices, visibility |

### Public
`GET /services`, `GET /reviews/public` (first name + last initial only), `GET /health`.

## 8. Security built in

- Passwords: bcrypt (cost 12). Never returned in any response.
- JWT in **httpOnly, SameSite** cookie (Secure in production). Token version check: password change/reset or disabling a user kills all sessions.
- OTP: `crypto.randomInt`, stored as HMAC-SHA256 only, 10-min expiry, 5 wrong attempts max (counted atomically), 60 s resend cooldown, 5 sends/hour, single use, auto-deleted by TTL index. Never logged except opt-in dev console mode, which is blocked in production.
- Forgot password does not reveal whether an account exists; login uses a dummy hash so timing doesn't either.
- RBAC on every protected route (`protect` + `authorize(role)`); ownership checks inside controllers; other users' records return 404.
- zod validation on every body/query/param (unknown fields rejected), `express-mongo-sanitize`, helmet headers, CORS allow-list, JSON body limit 100 kb, rate limits (general, login/register, OTP).
- Central error handler hides internals in production; request bodies are never logged.
- Prices, quotation totals and payment amounts are computed on the server, never trusted from the browser.

## 9. Testing

### Automated API test (real backend + real MongoDB)
```bash
cd server
# point MONGODB_URI at a THROWAWAY db whose name contains "test", e.g. mongodb://127.0.0.1:27017/quickfix_test
npm run test:smoke
```
Runs 44 checks: validation, register → OTP → verify, OTP reuse/cooldown/attempts, RBAC (401/403), wrong-role login, address + booking, admin assign, technician quotation → completion → invoice, PDF, cross-customer access blocked, cash payment, reviews, forgot/reset (single-use token, session revoked), security headers, NoSQL injection. It plants a known OTP hash in the DB, so it does **not** test your email/SMS provider.

### Manual checklist (do these yourself before launch)
1. `/api/health` shows `db: connected` and `otpDelivery.email` or `sms` = true.
2. Register with your own email/phone → code arrives → verify → lands on dashboard.
3. Enter a wrong code 5 times → blocked; resend before 60 s → blocked.
4. Forgot password → code → reset → old tab is logged out → log in with new password.
5. Add address → book service → log in as admin (other browser) → assign technician.
6. Technician: start → send quotation → customer accepts → complete → invoice appears.
7. Customer: download PDF; Pay Online with Razorpay **test** card; check payment history.
8. Try opening `/admin` as a customer → redirected. Try the admin API with a customer cookie → 403.
9. Resize to phone width: menu, dashboard sidebar, tables scroll.

## 10. Before going live
- Replace the placeholder phone/email (`client/.env`), legal pages (`pages/public/Legal.jsx`), and add a real technician photo at `client/public/images/hero-technician.png` (optional).
- `NODE_ENV=production`, HTTPS, serve frontend and API on the **same site** (e.g. `quickfixhome.in` + `api.quickfixhome.in`) so the cookie works with `COOKIE_SAMESITE=lax`.
- Add a Razorpay **webhook** (`payment.captured`) as a backup confirmation — not built yet (see gaps).
- Back up MongoDB (Atlas does this).

## 11. Known gaps (not built yet)
- Razorpay webhook and refunds.
- Admin screens for support tickets and review moderation (data is stored; no UI).
- Changing phone/email (needs re-verification flow).
- Push/SMS notifications for booking status changes.
- Technician availability / slot capacity — any number of bookings can pick the same slot.
- Automated frontend tests.
# Quickfix-home
