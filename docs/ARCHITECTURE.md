# Building Passport — System Architecture Specification

This document details the actual production architecture, service boundaries, data flows, and security infrastructure of the **Building Passport — Ghar Ki Pehchan** platform.

---

## 1. High-Level System Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER AGENT                             │
│       Desktop Browsers (1366x768)   &   Mobile Devices (390x844)       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
     (Interactive App Routes)          (Public QR Scans)
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│               VERCEL EDGE NETWORK (Next.js 16 App Router)              │
│       Host: https://mdm-building-passport.vercel.app                  │
│                                                                        │
│  ├── Server-Side Rendering (SSR) & Static HTML Caching                │
│  ├── App Router UI Pages (/dashboard, /buildings/:id, /public/...)    │
│  ├── Route Authorization Guards & Civil 403 Handlers                   │
│  └── Reverse Proxy Rewrites:                                           │
│       • /api/:path*     ──► Cloudflare Tunnel ──► Express Backend      │
│       • /uploads/:path* ──► Cloudflare Tunnel ──► File Storage         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         (Encrypted Cloudflare Tunnel)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  HOST SERVER (surya-server / Debian 13)                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Express.js 5 Backend API Service (Port 5000)                     │  │
│  │ Managed via systemd (building-passport-backend)                  │  │
│  │                                                                  │  │
│  │  ├── JWT Bearer Authentication Middleware                        │  │
│  │  ├── Sliding-Window IP Rate Limiter (15 req/min)                 │  │
│  │  ├── Role-Based Access Control Middleware (RBAC)                 │  │
│  │  ├── Central Record Domain Services:                             │  │
│  │  │   • BuildingService            • DrawingService              │  │
│  │  │   • RegulatoryApprovalService  • OwnerIdentityService        │  │
│  │  │   • AuditService               • ConstructionRulesService     │  │
│  │  ├── Multipart Upload Stream Processing (multer)                 │  │
│  │  └── Transactional Email Service (Gmail SMTP Provider)           │  │
│  └───────────────────┬──────────────────────────────┬───────────────┘  │
│                      │                              │                  │
│                      ▼                              ▼                  │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ PostgreSQL 17 Database        │  │ Persistent File Storage       │  │
│  │ (Port 5432, relational schema)│  │ /srv/storage/building-passport│  │
│  │                               │  │                               │  │
│  │  ├── 8 Core Civil Tables      │  │  ├── /drawings/               │  │
│  │  ├── Foreign Key Constraints  │  │  ├── /documents/              │  │
│  │  ├── Check Constraints        │  │  └── /photographs/            │  │
│  │  └── Connection Pool (pg.Pool)│  │                               │  │
│  └───────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Frontend Layer (Next.js 16 App Router)
* **Hosting Environment:** Vercel Global Edge Network (`https://mdm-building-passport.vercel.app`).
* **Framework:** Next.js 16.3.2 with React 19, TypeScript, and Tailwind CSS v3.
* **Responsibilities:**
  * Serves pre-rendered server components and dynamic client pages.
  * Encapsulates authentication context (`AuthContext`) and session hydration from local storage.
  * Intercepts unauthenticated navigation to restricted civil routes (e.g., `/buildings/new`) and redirects to `/login?redirect=...`.
  * Emits clean, descriptive 403 Forbidden screens for authenticated users attempting out-of-role actions (e.g., `public` citizens attempting building creation).
  * Serves the public Building Passport verification page (`/public/building/:passportId`) with zero required login credentials.

### 2.2 Backend API Service (Express.js 5 / Node.js)
* **Hosting Environment:** Debian 13 Linux host (`surya-server`).
* **Process Management:** Managed continuously as a systemd service with auto-restart on failure.
* **Responsibilities:**
  * Exposes authenticated REST endpoints under `/api/` for all civil lifecycle operations.
  * Enforces cryptographic JSON Web Token (JWT) validation on incoming requests.
  * Implements an in-memory sliding-window IP rate limiter preventing brute-force credential stuffing.
  * Orchestrates business logic across central record domains: Drawings, Approvals, Inspections, Defects, Maintenance, and Audit Logging.
  * Executes the deterministic Construction Rules & Compliance Engine (`construction-rules-v1.0`).

### 2.3 Relational Database Layer (PostgreSQL 17)
* **Hosting Environment:** Localhost database instance on Debian 13 host.
* **Connection Strategy:** Managed connection pool via the `pg` driver (`pg.Pool`), utilizing parameterized queries for complete SQL-injection immunity.
* **Core Tables (8 Relational Entities):**
  1. `users`: Identity registry, bcrypt password hashes, roles (`admin`, `engineer`, `owner`, `public`), and verification flags.
  2. `buildings`: Canonical building registry, architectural specifications, cadastral coordinates, and structural specs.
  3. `building_photographs`: Categorized visual media assets.
  4. `drawings`: Architectural, structural, and MEP blueprint revisions with approval state.
  5. `regulatory_approvals`: Statutory clearances (Fire NOC, Occupancy, Stability) with issuing authority metadata.
  6. `inspections`: Certified engineering inspections, auditor licenses, and condition grades.
  7. `defects`: Structural and non-structural defects with severity tiers and remediation tracking.
  8. `maintenance`: Preventative and corrective maintenance ledger, contractor details, and costs.
  9. `documents`: File catalog metadata and storage references.
  10. `audit_logs`: Immutable, append-only chronological ledger of all platform actions.
  11. `owner_identity_verifications`: Title holder verification records (operating in simulated Sandbox mode).

### 2.4 Persistent File Storage
* **Location:** Dedicated persistent directory on the server (`/srv/storage/building-passport/`).
* **Organization:**
  * Subdirectories partitioned by entity type (`/drawings/`, `/documents/`, `/photographs/`).
  * Files stored with sanitized timestamp-prefixed UUIDs to prevent directory traversal and name collision attacks.
  * Static file delivery served with appropriate `Content-Type` headers and MIME validation.

### 2.5 Transactional Email Service
* **Provider:** Dedicated Gmail SMTP service using TLS via Nodemailer.
* **Templates:** HTML and plaintext transactional templates for:
  * New account email verification with secure links and 6-digit OTP codes.
  * Password reset authentication flows.
* **Reliability:** Validated end-to-end against live external mailboxes with automatic database rollback if mail delivery fails.

### 2.6 Tunnel Architecture & Environment Distinction
* **Development/Demo Tunnel:** Cloudflare Quick Tunnel (`*.trycloudflare.com`) provides ephemeral TLS tunneling from `surya-server:5000` to the internet. Because quick tunnel URLs rotate on system restarts, production deployment documentation specifies transitioning to a permanent named Cloudflare Tunnel with fixed DNS.
* **Production-Backed vs. Simulation Distinction:**
  * Core civil records, PostgreSQL relational storage, drawings, approvals, inspections, compliance scoring, audit ledger, and public QR passports are **100% production-backed**.
  * The Owner Identity Verification module is an **explicit showcase simulation sandbox**, and does not connect to live UIDAI/Aadhaar or DigiLocker endpoints.

---

## 3. Data Flow & Security Topography

### 3.1 Authentication & Authorization Flow
```text
User Submits Credentials (/login)
           │
           ▼
Next.js App Router Proxy ──► Express Backend (/api/auth/login)
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       Rate Limiter Check (15/min)      PostgreSQL User Query
                    │                             │
                    ▼                             ▼
       Extract Password Hash ◄────── Validate Password (bcrypt)
                    │
                    ▼
     Generate Signed JWT (HS256)
                    │
                    ▼
       Return Token + User Profile
                    │
                    ▼
      Client Stores in localStorage
           (Included in HTTP Authorization: Bearer <token>)
```

### 3.2 Public QR Verification Flow
```text
Smartphone Scans QR Code on Building Plaque
           │
           ▼
Resolves URL: https://mdm-building-passport.vercel.app/public/building/BP-2026-04821
           │
           ▼
Vercel Edge Network renders /public/building/[passportId]
           │
           ▼
Fetches Public Building Record (No Auth Token Required)
           │
           ▼
Backend Applies Strict Privacy Redaction:
  • EXPOSED:  Name, Specs, GIS, Fire Rating, Approvals, Photo
  • REDACTED: Owner Phone, Owner Email, Private Blueprints, Audit Ledger
           │
           ▼
Browser Displays Verified Digital Building Passport
```

---

## 4. Key Architectural Design Decisions

1. **Deterministic Rule Engine over Opaque ML:**
   Structural safety evaluations must be explainable, auditable, and legally defensible. The compliance engine uses hard-coded statutory building code rules producing explicit action items rather than black-box probabilistic scores.
2. **Strict Server-Side RBAC over Client-Only Hiding:**
   Hiding buttons in the frontend UI is purely for user experience. Every state-altering API route executes server-side role validation (`enforceAuth`), guaranteeing that even handcrafted curl requests are rejected with HTTP 401 or 403.
3. **Decoupled Edge Frontend & Long-Running Backend:**
   Vercel handles high-concurrency static page loads and global SSL termination, while the self-hosted Express/PostgreSQL stack provides full control over data residency, connection pooling, and multi-gigabyte engineering drawing storage.
