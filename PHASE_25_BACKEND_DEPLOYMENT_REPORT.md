# PHASE 25 — BUILDING PASSPORT BACKEND DEPLOYMENT REPORT

## 1. Server Information
- **Target Hostname**: `surya-server`
- **Operating System**: Debian GNU/Linux 13 (trixie)
- **Kernel**: Linux 6.12.107+deb13-amd64 #1 SMP PREEMPT_DYNAMIC
- **LAN IP**: `192.168.1.28`
- **Tailscale IP**: `100.70.44.83`

## 2. Git Commit Deployed
- **Repository**: `https://github.com/shon2505/Building-passport-Ghar-ki-pehchan.git`
- **Branch**: `main`
- **Deployed Commit**: `d561e413e0ba845af6e8d88ca72188e8556db322`
- **Working Tree**: Clean (`nothing to commit, working tree clean`)

## 3. Node/npm & System Tool Versions
- **Node.js**: `v20.19.2` (LTS)
- **npm**: `9.2.0`
- **Git**: `2.47.3`
- **psql**: `17.11 (Debian 17.11-0+deb13u1)`
- **Systemd**: `257 (257.13-1~deb13u1)`

## 4. PostgreSQL Status
- **Service**: Rootless Quadlet Container (`postgres.service`) managed via systemd user unit with user lingering enabled.
- **Image**: `docker.io/library/postgres:17`
- **Status**: `active (running)`
- **Database**: `building_passport`
- **Role**: `surya`
- **Binding**: `127.0.0.1:5432` (strictly local loopback, never exposed to `0.0.0.0`)

## 5. Database Baseline
Verified read-only baseline queries before deployment, after restarts, and after server reboot:
- `users`: 3
- `buildings`: 3
- `building_photographs`: 4
- `inspections`: 3
- `defects`: 3
- `maintenance`: 3
- `documents`: 3
- `health_assessments`: 0
- `otp_verifications`: 0

No destructive commands, resets, migrations, or seed scripts were executed. All original project records remain 100% intact.

## 6. Application Directory
- **Path**: `/opt/building-passport`
- **Dedicated Service User**: `building-passport:building-passport` (`nologin` system service user)
- **Permissions**: `chmod 750 /opt/building-passport`, fully isolated from interactive users and root.

## 7. Storage Directory
- **Path**: `/srv/storage/building-passport/`
- **Subdirectories**: `photographs`, `documents`, `backups`
- **Ownership**: `building-passport:building-passport`
- **Permissions**: `chmod 750 /srv/storage/building-passport/` (not publicly readable, no external static exposure).

## 8. Environment Configuration Summary
Configured server-only environment file at `/opt/building-passport/.env` with `chmod 600`:
- `NODE_ENV`: `production`
- `PORT`: `5000`
- `HOST`: `127.0.0.1`
- `DATABASE_URL`: `postgresql://surya:***@127.0.0.1:5432/building_passport`
- `JWT_SECRET`: High-entropy 32-byte hexadecimal cryptographically secure key
- `JWT_EXPIRES_IN`: `7d`
- `SHOWCASE_MODE`: `true` (External SMTP disabled, in-memory development provider enabled)
- `EMAIL_PROVIDER`: `development`
- `STORAGE_DRIVER`: `local`
- `UPLOAD_DIR`: `/srv/storage/building-passport`
- `MAX_FILE_SIZE_MB`: `25`

*Note: No credentials or secrets are committed or exposed to the frontend.*

## 9. Express Server Status
- **Entry Point**: `src/server/express/server.ts`
- **Process Manager**: Systemd (`building-passport.service`)
- **Listening Address**: `127.0.0.1:5000`
- **Runtime Mode**: `production`

## 10. Systemd Service Status
- **Unit**: `/etc/systemd/system/building-passport.service`
- **Enabled**: `enabled` (starts automatically at boot)
- **State**: `active (running)`
- **Security Hardening**: `NoNewPrivileges=true`, `PrivateTmp=true`, runs unprivileged as `building-passport`

## 11. Health Endpoint Verification
- **URL**: `http://127.0.0.1:5000/api/health`
- **Status Code**: `200 OK`
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T15:49:53.886Z",
  "environment": "production",
  "database": {
    "provider": "postgresql",
    "connected": true,
    "mode": "live-postgresql",
    "postgres": {
      "connected": true,
      "endpoint": "127.0.0.1:5433",
      "database": "building_passport",
      "latencyMs": 16,
      "version": "PostgreSQL 17.11"
    },
    "mongodb": { "connected": false },
    "notice": "Connected to PostgreSQL 17 primary database."
  },
  "version": "2.0.0-stage2"
}
```

## 12. API Verification
All core endpoints tested from loopback via HTTP:
1. `GET /api/health` → `200 OK` (Live PostgreSQL connected)
2. `POST /api/auth/login` → `200 OK` (Authenticated demo admin successfully, returned session token)
3. `GET /api/auth/me` → `200 OK` (Authenticated user profile returned, role: `admin`)
4. `GET /api/buildings` → `200 OK` (Retrieved 3 buildings matching baseline)
5. `GET /api/buildings/bld_001_apex/health-assessments` → `200 OK` (Retrieved 0 assessments, matching baseline)
6. `GET /api/buildings/bld_001_apex/health-assessments/latest` → `404 Not Found` (Correctly indicates no assessment logged yet)
7. `GET /api/public/building/BP-2026-04821` → `200 OK` (Public QR passport returned building: "Apex Tower Commercial Hub")

## 13. CORS Configuration
- Wildcard `*` removed from production Express server.
- Whitelist restricted to configured application origins (`APP_URL`, `CORS_ORIGIN`, and development loopback origins).
- Rejects unpermitted cross-origin browser requests while allowing curl and server-to-server calls.

## 14. Network Listening Ports
Verified with `ss -lntp`:
- `PostgreSQL`: `127.0.0.1:5432` (Loopback only)
- `Backend`: `127.0.0.1:5000` (Loopback only)
- `WAN Exposure`: None. Neither PostgreSQL (5432) nor Express (5000) are exposed to LAN/WAN.

## 15. Restart & Reboot Verification
- **Service Restart**: `systemctl restart building-passport` tested; cleanly shuts down and resumes within seconds.
- **Server Reboot**: `sudo reboot` executed. Upon reboot:
  - Systemd user service `postgres.service` started automatically via user lingering.
  - Systemd system service `building-passport.service` started automatically.
  - `/api/health` responded with `200 OK` and live PostgreSQL connection.
  - Database baseline counts confirmed identical post-reboot.

## 16. Security Verification
- Startup warning verified in logs:
  `[SECURITY NOTICE] SHOWCASE MODE ENABLED — EXTERNAL EMAIL VERIFICATION DISABLED`
- No secrets or credentials in journal logs.
- Sensitive environment variables restricted with `0600` permissions.
- Service runs as unprivileged system user `building-passport`.

## 17. Remaining Blockers
- None for backend deployment.

## 18. Next Recommended Phase
- **Phase 26**: Cloudflare Tunnel ingress configuration to securely route traffic from Cloudflare Edge to `127.0.0.1:5000` on `surya-server`, followed by Vercel frontend deployment.
