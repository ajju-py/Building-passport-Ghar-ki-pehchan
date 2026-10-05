# Building Passport — Platform Feature Matrix

This matrix documents the functional status, underlying technology stack, and interactive demonstration locations across the **Building Passport — Ghar Ki Pehchan** platform.

| Feature | Status | Technology | Demo Location |
| :--- | :--- | :--- | :--- |
| **User Authentication** | Production Verified | JWT (HS256), bcryptjs password hashing, sliding-window IP rate limiter | `/login`, `/register` |
| **Email Verification** | Production Verified | SHA-256 token hashing, 6-digit OTP, dedicated Gmail SMTP provider via Nodemailer | `/verify-email`, Registration flow |
| **Password Reset** | Production Verified | Generic timing-safe endpoint, single-use OTP validation, session invalidation | `/forgot-password`, `/reset-password` |
| **Role-Based Access Control (RBAC)** | Production Verified | Express & Next.js gateway authorization middleware, client-side route guards, 403 Forbidden state | `/dashboard`, `/buildings/new`, `/buildings/:id` |
| **Building Registry** | Production Verified | PostgreSQL 17 relational persistence, search & filter query engine, civil schema validation | `/buildings`, `/dashboard` |
| **Central Building Record** | Production Verified | Multi-tab civil engineering interface, Next.js App Router, Lucide React architectural icons | `/buildings/:id` |
| **GIS & Location Mapping** | Production Verified | WGS84 GPS coordinate precision, OpenStreetMap cadastral deep links, cadastral CTS tracking | `/buildings/:id` (Overview & GIS Tab) |
| **Document Management** | Production Verified | Multipart file streaming (`multer`), persistent disk storage, PostgreSQL document metadata | `/buildings/:id` (Documents & Records Tab) |
| **Building Photographs** | Production Verified | Categorized photo records (exterior facade, structural core), responsive image viewer | `/buildings/:id` (Overview Card & Photos) |
| **Blueprints & Drawings** | Production Verified | Discipline tagging (Architectural, Structural, MEP), sheet numbering, scale notation | `/buildings/:id` (Drawings & Revisions Tab) |
| **Drawing Revisions** | Production Verified | Automatic revision code sequencing (`R0`, `R1`, `R2`), version history, administrative approval workflows | `/buildings/:id` (Drawings & Revisions Modal) |
| **Statutory Approvals** | Production Verified | Regulatory approval entity tracking, issuing authority metadata, condition tracking | `/buildings/:id` (Statutory Approvals & NOCs Tab) |
| **NOC Validity Tracking** | Production Verified | Expiry countdown calculation, status transitions (`ACTIVE`, `PENDING_RENEWAL`, `EXPIRED`) | `/buildings/:id` (Statutory Approvals & NOCs Tab) |
| **Civil Inspections** | Production Verified | Certified engineering inspection records, inspection types (Annual, Structural, Post-Seismic) | `/buildings/:id` (Inspections & Maintenance Tab) |
| **Compliance Engine** | Production Verified | Deterministic civil rule evaluator (`construction-rules-v1.0`), 15 statutory building rules, scoring algorithm | `/buildings/:id` (Construction Rules Tab) |
| **Identity Verification Sandbox** | Showcase Simulation | Simulated Aadhaar OTP verification gateway, test OTP hint, explicit sandbox disclosure banners | `/buildings/:id` (Owner Verification Tab) |
| **Immutable Audit Trail** | Production Verified | Chronological append-only event ledger, actor attribution, cryptographic event indexing | `/buildings/:id` (Audit Trail Tab) |
| **Digital QR Passport** | Production Verified | SVG QR code generator, canonical URL encoding, download & print passport badges | `/buildings/:id` (Digital QR Passport Tab) |
| **Public Building Passport** | Production Verified | Server-side rendered unauthenticated page, strict owner contact & private blueprint redaction | `/public/building/:passportId` |
| **Responsive Mobile UI** | Production Verified | Mobile drawer navigation, adaptive layouts, touch targets, verified across 22 mobile browser specs | Global UI, Desktop (1366x768) & Mobile (390x844) |

---

### Implementation Legend

* **Production Verified:** Fully implemented with PostgreSQL 17 relational database persistence, server-side authorization enforcement, and verified via automated Playwright E2E and unit test suites.
* **Showcase Simulation:** Intentionally simulated module designed for presentation fidelity without claiming external government agency credentials (e.g., live UIDAI/Aadhaar integration).
