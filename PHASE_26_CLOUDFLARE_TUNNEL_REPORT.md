# PHASE 26 — CLOUDFLARE TUNNEL REPORT

## Final Status
**CLOUDFLARE TUNNEL VERIFIED — API PUBLICLY ACCESSIBLE VIA HTTPS**

---

## 1. Executive Summary
Phase 26 successfully established secure, external HTTPS connectivity for the Building Passport backend (`surya-server`) via Cloudflare Tunnel. Per administrator instructions, because `buildingpassport.org` is not owned / has no active custom domain delegation, the tunnel architecture was transitioned to a dedicated, automated **Cloudflare Quick Tunnel** routing to the local Express backend loopback.

The local backend and PostgreSQL database remain strictly unexposed to WAN and LAN interfaces.

---

## 2. Infrastructure & Tunnel Configuration
- **Host Server**: `surya-server` (Debian 13 Trixie, `192.168.1.28`, Tailscale `100.70.44.83`)
- **Tunnel Mode**: Cloudflare Quick Tunnel (`trycloudflare.com`)
- **Local Ingress Target**: `http://127.0.0.1:5000`
- **Public API Endpoint**: `https://lexmark-slip-melissa-practices.trycloudflare.com` (Active post-reboot URL)
- **URL Discovery Log**: `/var/log/cloudflared.log`
- **System Service**: `/etc/systemd/system/cloudflared.service`
- **Service Status**: `active (running)`
- **Auto-restart Policy**: `Restart=always`, `RestartSec=5s`
- **Auto-start on Boot**: `enabled` (survived full server reboot test)

---

## 3. Pre-Check Verification
Prior to tunnel activation, local backend readiness and network port isolation were validated:
- `building-passport.service`: `active (running)`
- `postgres.service` (Podman rootless quadlet): `active (running)`
- Loopback Healthcheck: `http://127.0.0.1:5000/api/health` returned `HTTP 200 OK`
- Local Listening Ports (`ss -lntp`):
  - `127.0.0.1:5000` — Express Node API (Loopback only)
  - `127.0.0.1:5432` — PostgreSQL container pasta namespace (Loopback only)
  - `127.0.0.1:20241` — Cloudflared metrics/management (Loopback only)
  - `0.0.0.0:22` / `[::]:22` — OpenSSH daemon

---

## 4. Security & Network Isolation Audit
Rigorous port-scanning and socket connection tests from outside the server (`192.168.1.x` and Tailscale) confirmed zero public exposure of backend internals:

| Target Address:Port | Service | Test Result | Security Status |
| :--- | :--- | :--- | :--- |
| `192.168.1.28:5000` | Express API | `BLOCKED (TIMEOUT)` | Secure (Not listening on LAN) |
| `192.168.1.28:5432` | PostgreSQL | `BLOCKED (TIMEOUT)` | Secure (Not listening on LAN) |
| `100.70.44.83:5000` | Express API | `BLOCKED (TIMEOUT)` | Secure (Not listening on Tailscale) |
| `100.70.44.83:5432` | PostgreSQL | `BLOCKED (TIMEOUT)` | Secure (Not listening on Tailscale) |
| `/srv/storage` | Local Storage | `chmod 750` | Isolated (Unprivileged service user only) |

Router port forwarding was **not configured** and is **not required**. All incoming traffic enters via Cloudflare edge encrypted QUIC tunnels.

---

## 5. HTTPS Verification & TLS Certificate Details
External HTTPS TLS handshake and certificate chain validation:
- **Server Name (SNI)**: `lexmark-slip-melissa-practices.trycloudflare.com`
- **Edge Issuer**: Google Trust Services (`CN: WE1`, `O: Google Trust Services`, `C: US`)
- **Subject**: `CN: trycloudflare.com`
- **TLS Handshake**: Successful (`Authorized: true`)
- **Protocol**: HTTP/1.1 & HTTP/2 over TLS 1.3
- **Edge Header**: `Server: cloudflare`, `CF-Ray: a43e221add7026a7-BOM` (Mumbai Edge Datacenter)

---

## 6. External API Verification Suite
All core API routes were tested through the public Cloudflare HTTPS endpoint from an external client:

### A. Health Endpoint
```http
GET https://lexmark-slip-melissa-practices.trycloudflare.com/api/health
```
- **Response Code**: `200 OK`
- **Payload Verification**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-01T20:14:22.825Z",
    "environment": "production",
    "database": {
      "provider": "postgresql",
      "connected": true,
      "mode": "live-postgresql",
      "postgres": {
        "connected": true,
        "endpoint": "127.0.0.1:5433",
        "database": "building_passport",
        "latencyMs": 190,
        "version": "PostgreSQL 17.11"
      },
      "mongodb": { "connected": false },
      "notice": "Connected to PostgreSQL 17 primary database."
    },
    "version": "2.0.0-stage2"
  }
  ```

### B. Unauthenticated Protected Route
```http
GET https://lexmark-slip-melissa-practices.trycloudflare.com/api/auth/me
```
- **Response Code**: `401 Unauthorized`
- **Payload**:
  ```json
  {
    "success": false,
    "error": "Authentication required. Please provide a valid Bearer token."
  }
  ```

### C. Authentication Flow
```http
POST https://lexmark-slip-melissa-practices.trycloudflare.com/api/auth/login
```
- **Response Code**: `200 OK`
- **Result**: Authenticated successfully, cryptographically signed JWT issued.

### D. Authenticated Protected Route
```http
GET https://lexmark-slip-melissa-practices.trycloudflare.com/api/auth/me
Authorization: Bearer <token>
```
- **Response Code**: `200 OK`
- **Payload**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "usr_admin_001",
      "email": "admin@buildingpassport.org",
      "name": "Er. Alok Verma (Chief Municipal Engineer)",
      "role": "admin",
      "accountStatus": "active"
    }
  }
  ```

### E. Public Passport & QR Endpoint
```http
GET https://lexmark-slip-melissa-practices.trycloudflare.com/api/public/building/BP-2026-04821
```
- **Response Code**: `200 OK`
- **Payload**: Returned full building details for "Apex Tower Commercial Hub", including QR code data URL and 2 verified photographs.

---

## 7. Reboot & Resilience Test
A full server reboot was triggered via `sudo reboot` to test service auto-recovery.
- Post-reboot checks confirmed:
  - `postgres.service` started automatically via user lingering.
  - `building-passport.service` started automatically.
  - `cloudflared.service` started automatically.
  - Quick Tunnel re-established outbound QUIC connectivity with Cloudflare Edge.
  - External HTTPS requests immediately responded with `HTTP 200 OK`.

---

## 8. Log Audit & Secret Protection
Systemd and application logs were audited post-reboot:
- `journalctl -u cloudflared -b`
- `journalctl -u building-passport -b`
- `/var/log/cloudflared.log`

**Audit Findings**:
- ZERO database passwords exposed.
- ZERO JWT secrets or tokens exposed.
- ZERO private keys or credentials exposed.
- Cloudflare Tunnel runs without requiring long-lived global API credentials.

---

## 9. Database Baseline Verification
Verified via read-only SQL count queries before and after all Phase 26 actions:
- `users`: `3`
- `buildings`: `3`
- `building_photographs`: `4`
- `inspections`: `3`
- `defects`: `3`
- `maintenance`: `3`
- `documents`: `3`
- `health_assessments`: `0`
- `otp_verifications`: `0`

**Result**: Baseline perfectly intact. Zero records were inserted, modified, or deleted.

---

## 10. CORS Configuration
- Conservative origin filtering remains in effect (no wildcard `*`).
- Express server allows requests from `APP_URL`, `CORS_ORIGIN`, and development origins.
- Next phase (Phase 27) will add the production Vercel frontend URL to `CORS_ORIGIN` in `/opt/building-passport/.env`.

---

## 11. Remaining Blockers
- **None**: Backend is live, healthy, secure, and ready for frontend integration.
