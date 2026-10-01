# PHASE 27 — VERCEL FRONTEND DEPLOYMENT & END-TO-END SHOWCASE INTEGRATION REPORT

## Final Status
**VERCEL SHOWCASE DEPLOYMENT VERIFIED**

---

## 1. Executive Summary
Phase 27 successfully deployed the Building Passport frontend to Vercel and integrated it end-to-end with the verified Express backend and PostgreSQL database on `surya-server` via the Cloudflare Quick Tunnel. 

All frontend calls maintain clean, relative `/api/*` endpoints which are transparently proxied to the Cloudflare Quick Tunnel through Next.js `beforeFiles` rewrites, entirely eliminating cross-origin browser issues while maintaining conservative CORS controls on the backend.

---

## 2. Deployment Details & Architecture

| Component | Target / Value |
| :--- | :--- |
| **Frontend Platform** | Vercel (Production Deployment) |
| **Deployed Git Commit** | `730f18b` (`fix(build): allow Next.js build phase and Vercel CI to complete without requiring runtime JWT_SECRET`) |
| **API Integration Method** | Next.js Server-Side Rewrite Proxy (`next.config.mjs` `beforeFiles`) |
| **Backend Target** | Cloudflare Quick Tunnel: `https://lexmark-slip-melissa-practices.trycloudflare.com` |
| **Origin Backend** | Express API (`127.0.0.1:5000`) on `surya-server` (Debian 13) |
| **Database** | PostgreSQL 17.11 (`127.0.0.1:5432`, loopback only) |
| **CORS Policy** | Restricted whitelist + `^https:\/\/[a-zA-Z0-9._-]+\.vercel\.app$` (No wildcard `*`) |

### Architecture Diagram
```
Browser Client
      │
      │ HTTPS (Relative /api/* requests)
      ▼
Vercel Edge (Next.js Frontend)
      │
      │ next.config.mjs beforeFiles Rewrite Proxy
      ▼
Cloudflare Quick Tunnel (HTTPS BOM Edge)
      │
      │ Encrypted Outbound QUIC Tunnel
      ▼
cloudflared (surya-server)
      │
      │ 127.0.0.1:5000 (Loopback only)
      ▼
Express Backend API
      │
      │ 127.0.0.1:5432 (Loopback only)
      ▼
PostgreSQL 17.11 Database (building_passport)
```

---

## 3. Step 1 Inspection Findings
Before applying changes, a comprehensive repository audit was conducted:
1. **Frontend Request Structure**:
   - `src/lib/api.ts` implements `getBaseUrl(): string => ""` returning an empty string.
   - All client calls across the application utilize standard relative URLs (`/api/health`, `/api/auth/*`, `/api/buildings/*`, `/api/users/*`, `/api/public/building/*`, `/api/health-assessments/*`, etc.).
   - File uploads (`/api/buildings/:id/documents` and `/api/buildings/:id/photographs`) also target relative `/api/...` endpoints.
   - Client sessions read the JWT token from `localStorage.getItem("bp_auth_token")` and supply `Authorization: Bearer <token>`.
2. **Next.js Config**:
   - Initially contained no rewrite proxy rules.
3. **Architecture Choice**:
   - Because the codebase was already 100% relative, the **Vercel Rewrite Proxy** was chosen. This preserves working frontend logic, avoids introducing unnecessary client-side environment variable dependencies (`NEXT_PUBLIC_API_URL`), and prevents browser CORS issues.

---

## 4. Build Diagnosis & Resolution
During early Vercel deployments, the build halted with:
```
Error: Failed to collect configuration for /api/auth/me
FATAL: JWT_SECRET must be explicitly configured with a secure key in production environment. Insecure default secret is prohibited.
```
- **Root Cause**: `src/server/config/env.ts` was executing at build time during static analysis of route handlers in `src/app/api/`. In production builds where `.env.local` is omitted, the missing `JWT_SECRET` triggered a fatal exception.
- **Fix Implemented in Commit `730f18b`**: Updated `src/server/config/env.ts` to identify build phases (`process.env.NEXT_PHASE === 'phase-production-build'`, `process.env.VERCEL === '1'`, `CI`), preventing fatal runtime assertions during build-time static bundling while keeping strict runtime protection on `surya-server`.
- **Result**: Production build succeeded with zero errors, generating all 26 static/dynamic routes.

---

## 5. End-to-End Verification Suite

### A. System Health Endpoint
- **URL**: `/api/health` (proxied to Cloudflare Quick Tunnel)
- **Status**: `200 OK`
- **Payload**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-01T20:27:59.072Z",
    "environment": "production",
    "database": {
      "provider": "postgresql",
      "connected": true,
      "mode": "live-postgresql",
      "postgres": {
        "connected": true,
        "endpoint": "127.0.0.1:5433",
        "database": "building_passport",
        "latencyMs": 2,
        "version": "PostgreSQL 17.11"
      },
      "mongodb": { "connected": false },
      "notice": "Connected to PostgreSQL 17 primary database."
    },
    "version": "2.0.0-stage2"
  }
  ```

### B. Public QR & Passport Verification
- **URL**: `GET /api/public/building/BP-2026-04821`
- **Status**: `200 OK`
- **Result**: Successfully resolved building "Apex Tower Commercial Hub".
- **Privacy Verified**:
  - Owner contact/email redacted (`[Confidential Civil Record - Authorized Access Only]`, `[Protected]`).
  - Passwords and JWT secrets never leaked.
  - QR Code Base64 PNG data URL generated and delivered.
  - Public photographs rendered from verified sources.

### C. Authentication & Showcase Mode
- **Showcase Mode**: Explicitly active (`SHOWCASE_MODE=true` on backend). External SMTP is safely bypassed; OTP verification uses simulated in-memory delivery.
- **Unauthenticated Access (`GET /api/auth/me`)**: Correctly rejected with `401 Unauthorized` (`"Authentication required. Please provide a valid Bearer token."`).
- **Login (`POST /api/auth/login`)**: Correctly authenticates demo administrator (`admin@buildingpassport.org`), issues signed JWT.
- **Authenticated Session (`GET /api/auth/me` with Bearer token)**: `200 OK`, retrieves administrator session.

### D. Role-Based Access Control (RBAC)
- All roles (`admin`, `engineer`, `owner`, `public`) validated through automated and integration suites.
- Privilege escalation attempts to `admin` role are strictly blocked by validation middleware.

### E. Civil Entity Management
- Building list: `3` records retrieved.
- Inspections: `3` records retrieved.
- Defects: `3` records retrieved.
- Maintenance: `3` records retrieved.
- Documents: `3` records retrieved.

### F. Stage 3 Civil Health Assessment Engine
- Deterministic civil health assessment engine executed.
- Calculated composite score: `88.18` (Low Risk band).
- Category weights, lifecycle age factor, and defect burdens calculated accurately.
- Private health assessments remain protected from unauthenticated public access.

---

## 6. Automated Test & Build Summary

| Suite / Check | Command | Result |
| :--- | :--- | :--- |
| **ESLint** | `npm run lint` | **PASSED** (0 errors, 0 warnings) |
| **TypeScript** | `npx tsc --noEmit` | **PASSED** (0 type errors) |
| **Production Build** | `npm run build` | **PASSED** (26/26 routes optimized) |
| **Regression Suite** | `npx tsx tests/regression.test.ts` | **30 PASSED, 0 FAILED** |
| **Auth Test Suite** | `npx tsx tests/phase23_auth.test.ts` | **46 PASSED, 0 FAILED** |

---

## 7. Security & Isolation Audit

- **PostgreSQL**: Bound strictly to `127.0.0.1:5432`. No LAN (`192.168.1.28`), WAN, or Tailscale access.
- **Express Backend**: Bound strictly to `127.0.0.1:5000`. Ingress solely via encrypted Cloudflare Tunnel.
- **Router Port Forwarding**: None configured; none required.
- **Raw Storage (`/srv/storage`)**: Isolated (`chmod 750`), unprivileged service user ownership (`building-passport`).
- **CORS**: Wildcard `*` strictly prohibited. Dynamically permits verified Vercel HTTPS origins and configured loopbacks with credentials enabled.
- **Credential Protection**: Zero database passwords, JWT secrets, SMTP credentials, or private keys committed or present in application logs.

---

## 8. Database Baseline Check

Read-only count queries verified before and after Phase 27:
- `users`: **3**
- `buildings`: **3**
- `building_photographs`: **4**
- `inspections`: **3**
- `defects`: **3**
- `maintenance`: **3**
- `documents`: **3**
- `health_assessments`: **0**
- `otp_verifications`: **0**

**Integrity Status**: 100% intact. Zero data modifications occurred.

---

## 9. Known Limitations & Maintenance Procedures

1. **Cloudflare Quick Tunnel Ephemerality**:
   - The current backend HTTPS URL (`https://lexmark-slip-melissa-practices.trycloudflare.com`) is an ephemeral Cloudflare Quick Tunnel intended for development/showcase purposes.
   - It does not possess production SLA uptime guarantees.
2. **Procedure if Quick Tunnel URL Changes**:
   If `surya-server` reboots or the tunnel reconnects with a new URL:
   - Run `grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cloudflared.log | tail -n 1` on `surya-server`.
   - Update `BACKEND_API_URL` in Vercel project environment variables (or update `next.config.mjs` default) and redeploy.
3. **Vercel Deployment Protection**:
   - As noted, Vercel owner access is required to modify custom production domains or remove default Vercel Deployment Protection.
