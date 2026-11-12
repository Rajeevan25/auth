# Production-Ready Full-Stack Authentication Monorepo

A modern, production-grade authentication and session management system built as an npm workspaces monorepo. Engineered with zero-trust security principles, strict TypeScript, responsive WCAG AA accessibility, rotating dual-token authentication in `httpOnly` cookies, rate limiting, and defensive brute-force lockouts.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript (strict), Vite, Tailwind CSS, React Router v6, TanStack Query, React Hook Form, Zod, Lucide React, Axios |
| **Backend** | Node.js, Express, TypeScript (strict), Prisma ORM, PostgreSQL, Zod, Pino Logger, Helmet, CORS, Express-Rate-Limit, Bcrypt |
| **Authentication** | 15-minute JWT Access Tokens + 7-day Rotating Refresh Tokens stored exclusively in `HttpOnly`, `SameSite`, `Secure` cookies |
| **Tooling & CI** | Docker Compose, Vitest + React Testing Library (frontend), Jest + Supertest (backend), ESLint, Prettier |

---

## 📂 Project Structure

```text
├── apps/
│   ├── api/                           # Express + TypeScript + Prisma Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Database schema (User, RefreshToken, PasswordResetToken)
│   │   │   └── seed.ts                # Seed script with default demo account
│   │   ├── src/
│   │   │   ├── config/                # Validated environment configuration and Prisma singleton
│   │   │   ├── controllers/           # HTTP Request/Response controllers (Auth, Health)
│   │   │   ├── middleware/            # Auth guard, Zod validator, rate limiters, logger, error handler
│   │   │   ├── repositories/          # Prisma database access abstraction layer
│   │   │   ├── routes/                # Modular Express routers & Zod route contracts
│   │   │   ├── services/              # Business logic (Auth, Token rotation, Session security)
│   │   │   ├── utils/                 # Password hashing, cryptographic token generators, logger
│   │   │   ├── app.ts                 # Express application assembly
│   │   │   └── server.ts              # Server lifecycle and graceful shutdown handling
│   │   ├── Dockerfile                 # Multi-stage production container for API
│   │   └── jest.config.ts             # Jest & ts-jest test runner configuration
│   │
│   └── web/                           # React 18 + Vite Frontend SPA
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/            # DarkModeToggle, ErrorBanner, PasswordStrengthMeter, CapsLockWarning, etc.
│       │   │   └── layout/            # Split-screen AuthLayout, DashboardNavbar
│       │   ├── context/               # AuthContext (session state) and ThemeContext (dark/light)
│       │   ├── hooks/                 # useAuth, useTheme custom hooks
│       │   ├── lib/
│       │   │   └── api.ts             # Axios client with concurrency-safe 401 refresh token interceptor
│       │   ├── pages/                 # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, DashboardPage, NotFoundPage
│       │   ├── routes/                # ProtectedRoute and PublicOnlyRoute navigation guards
│       │   └── styles/                # Tailwind CSS globals and animations
│       ├── Dockerfile                 # Multi-stage production container with Nginx
│       ├── nginx.conf                 # SPA routing and API reverse-proxy configuration
│       └── vite.config.ts             # Vite build and Vitest test runner configuration
│
├── docker-compose.yml                 # Orchestration for PostgreSQL 16 + API + Web
├── package.json                       # npm workspaces configuration
├── .gitignore                         # Git exclusion rules
└── README.md                          # Documentation
```

---

## 🔐 Security Architecture Deep-Dive

### 1. Dual-Token Architecture with Rotation
- **Access Tokens**: Short-lived (15 minutes), stateless JWTs containing user identity (`userId`, `email`, `name`). Validated on each request by `authenticate` middleware.
- **Refresh Tokens**: Long-lived (7 days default, 30 days if "Remember Me" is checked). Cryptographically generated 48-byte strings stored in the database as **SHA-256 hashes**.
- **Rotation**: Every time `/api/auth/refresh` is called, the old refresh token is permanently revoked, and an entirely new token pair is issued.
- **Theft / Replay Detection**: If a revoked refresh token is presented to `/api/auth/refresh`, the server detects session hijacking and **immediately revokes all active refresh tokens for that user**, terminating all malicious and legitimate sessions.

### 2. Cookie Security
Tokens are transmitted strictly using cookies with flags:
- `HttpOnly: true` (Prevents client-side JavaScript access, neutralizing XSS credential theft).
- `SameSite: 'strict'` / `'lax'` (Prevents CSRF cross-origin state transmission).
- `Secure: true` in production (Transmitted only over HTTPS).

### 3. Brute-Force & Enumeration Protections
- **Account Lockout**: After 5 consecutive failed login attempts, the account is locked for **15 minutes** (`failedAttempts: 5`, `lockedUntil: timestamp`). Any subsequent login attempts return HTTP `429 Too Many Requests` with a live seconds countdown.
- **Timing Attack Defense**: When an unknown email attempts to log in, the API performs a dummy bcrypt comparison against a precomputed salt hash so response duration is indistinguishable from real account verification.
- **Generic Responses**: Login, registration, and password recovery endpoints return uniform responses to prevent malicious user discovery.

---

## 🚀 Quickstart Guide (PostgreSQL Setup)

This project runs exclusively with **PostgreSQL** as the database engine via Prisma ORM.

### Step 1: Ensure Your PostgreSQL Instance is Running
Make sure your local PostgreSQL server is active and accessible. You can verify your connection string in `apps/api/.env`:

```env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public
```

*(If your PostgreSQL uses a different user, password, or port such as 5433/5434, simply update `DATABASE_URL` in `apps/api/.env` accordingly).*

### Step 2: Initialize Database & Seed Demo User
```bash
# Generate the Prisma Client
npm run db:generate

# Apply migrations to your PostgreSQL database
npm run db:migrate

# Seed the default demo user account
npm run db:seed
```

> **Demo User Credentials**:
> - **Email**: `demo@example.com`
> - **Password**: `Password123`

### Step 3: Start the Development Servers
Open two terminal windows:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:api

# Terminal 2: Start Frontend Web Client (Port 5173)
npm run dev:web
```

Open your browser at **[http://localhost:5173](http://localhost:5173)** to interact with the full application!

---

## 🧪 Running Automated Tests

The codebase includes end-to-end integration and unit tests covering login validation, API authentication, lockout rules, token rotation, and theft detection:

```bash
# Run Backend API tests with Jest & Supertest
npm run test:api

# Run Frontend React tests with Vitest & React Testing Library
npm run test:web

# Run all tests across the monorepo
npm run test
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Health Check
- `GET /health`
  - Returns `200 OK` with service uptime and timestamp.

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Registers a new user account and sets auth cookies | None |
| `POST` | `/auth/login` | Authenticates user; locks account after 5 failures | None |
| `POST` | `/auth/logout` | Revokes the current refresh token and clears cookies | None |
| `POST` | `/auth/refresh` | Rotates the refresh token and issues a new access token | Cookie |
| `GET` | `/auth/me` | Returns current user profile | Bearer / Cookie |
| `POST` | `/auth/forgot-password` | Initiates password reset (logs reset link in dev) | None |
| `POST` | `/auth/reset-password` | Resets password with valid token and revokes sessions | None |
| `GET` | `/auth/oauth/google` | Architectural stub for Google OAuth 2.0 | None |
| `GET` | `/auth/oauth/github` | Architectural stub for GitHub OAuth 2.0 | None |

#### Sample Login Request
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "Password123",
  "rememberMe": true
}
```

#### Sample Login Success Response
```http
HTTP/1.1 200 OK
Set-Cookie: accessToken=eyJhbGci...; Path=/; HttpOnly; SameSite=Lax; Max-Age=900
Set-Cookie: refreshToken=d3f2a...; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000
Content-Type: application/json

{
  "success": true,
  "message": "Logged in successfully",
  "user": {
    "id": "c1f7b029-7c85-484d-9689-53641dd94002",
    "email": "demo@example.com",
    "name": "Demo User",
    "createdAt": "2026-11-12T00:00:00.000Z"
  }
}
```

#### Sample 429 Lockout Response (After 5 Failed Attempts)
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "message": "Account is temporarily locked due to 5 failed login attempts. Please try again in 15 minutes.",
  "lockoutRemainingSeconds": 900
}
```

---

## ⚙️ Environment Variables Reference

### Backend (`apps/api/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development`, `test`, `production`) |
| `PORT` | `5000` | Port on which Express listens |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for credentials |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | *Random String* | Secret used to sign and verify access tokens |
| `JWT_REFRESH_SECRET` | *Random String* | Secret used to sign refresh token payload |
| `JWT_ACCESS_EXPIRATION` | `15m` | Lifetime of the access token |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` | Refresh token lifetime for standard sessions |
| `JWT_REFRESH_REMEMBER_ME_DAYS` | `30` | Refresh token lifetime when "Remember Me" is selected |
| `PASSWORD_RESET_EXPIRATION_MINUTES` | `60` | Validity duration of password reset tokens |

### Frontend (`apps/web/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Target URL for backend API calls |
| `VITE_APP_TITLE` | `SecureAuth` | Page title displayed in browser |

---

## 🧩 How to Add the Next Feature

This repository was architected with clean layer boundaries (`Routes -> Controllers -> Services -> Repositories`) so adding new capabilities is straightforward and predictable.

### 1. Adding Role-Based Access Control (RBAC)
1. **Update Prisma Schema** (`apps/api/prisma/schema.prisma`):
   ```prisma
   enum Role {
     USER
     ADMIN
     MANAGER
   }

   model User {
     // ...
     role Role @default(USER)
   }
   ```
2. **Run migration**: `npx prisma migrate dev --name add_user_roles`.
3. **Include role in token** (`token.utils.ts`):
   Add `role: user.role` to `AccessTokenPayload`.
4. **Create Role Middleware** (`apps/api/src/middleware/role.middleware.ts`):
   ```typescript
   export function requireRole(allowedRoles: Role[]) {
     return (req: Request, res: Response, next: NextFunction) => {
       if (!req.user || !allowedRoles.includes(req.user.role)) {
         throw new ForbiddenError('Insufficient permissions');
       }
       next();
     };
   }
   ```
5. **Protect routes**: `router.get('/admin/metrics', authenticate, requireRole(['ADMIN']), adminController.getMetrics);`.

---

### 2. Adding Email Verification
1. **Add Verification Token Model**:
   ```prisma
   model EmailVerificationToken {
     id        String   @id @default(uuid())
     userId    String
     tokenHash String   @unique
     expiresAt DateTime
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }
   ```
2. **Hook into Registration** (`auth.service.ts`):
   - In `register()`, generate a 32-byte random token and hash it with SHA-256.
   - Dispatch an email containing `http://localhost:5173/verify-email?token=${rawToken}` via Resend / SendGrid.
3. **Create Endpoint**:
   - `POST /api/auth/verify-email`: Accepts token, validates expiration, sets `user.isEmailVerified = true`.
4. **Enforce in Auth Middleware**:
   - If `!req.user.isEmailVerified`, return `403 Forbidden` with `{ code: 'EMAIL_NOT_VERIFIED' }`.

---

### 3. Adding Two-Factor Authentication (2FA / TOTP)
1. **Install library**: `npm --workspace=apps/api install otplib qrcode`.
2. **Update Prisma**:
   ```prisma
   model User {
     // ...
     twoFactorSecret  String?
     isTwoFactorActive Boolean @default(false)
   }
   ```
3. **Setup Flow**:
   - `POST /api/auth/2fa/generate`: Generates TOTP secret and returns QR code data URI.
   - `POST /api/auth/2fa/verify`: Verifies 6-digit OTP code using `authenticator.verify()`, enables 2FA.
4. **Login Modification**:
   - In `login()`, if `user.isTwoFactorActive === true`, do not issue access cookies immediately; instead, return a temporary `2fa_required` token.
   - User submits code to `POST /api/auth/2fa/authenticate` to receive the final access and refresh cookies.

---

### 4. Implementing Full OAuth (Google & GitHub)
1. **Backend Route Stubs Ready**:
   The routes `/api/auth/oauth/google` and `/api/auth/oauth/github` are pre-wired in `apps/api/src/routes/auth.routes.ts`.
2. **Install Arctic or Passport**: `npm --workspace=apps/api install arctic`.
3. **Initialize Provider**:
   ```typescript
   import { Google } from 'arctic';
   export const google = new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${env.API_URL}/api/auth/oauth/google/callback`);
   ```
4. **Exchange authorization code for tokens**, locate user by email (or create new user), and call `tokenService.issueTokens(user)` and `tokenService.setAuthCookies(res, tokens)`.

---

## 📄 License
MIT License. Built for production security and developer happiness.

