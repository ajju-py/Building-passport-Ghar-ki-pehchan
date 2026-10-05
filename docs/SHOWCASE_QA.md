# Building Passport — Technical Showcase Q&A Guide

This document prepares project presenters, engineers, and faculty evaluators with technically accurate, implementation-verified answers regarding the **Building Passport (घर की पहचान)** civil engineering digital identity platform.

---

### 1. What problem does Building Passport solve?
Civil building data is historically fragmented across paper blueprints, disparate municipal authority files, unorganized PDF scans, private contractor email threads, and physical filing cabinets. When structural alterations occur, ownership transfers, or emergencies strike, critical structural engineering specifications, NOC validity dates, and inspection histories are inaccessible or lost. Building Passport unifies this data into a single, tamper-evident digital building record tied to an immutable civil identifier.

### 2. Why is a digital Building Passport required?
Modern civil governance and lifecycle asset management (aligned with ISO 19650 BIM data longevity principles) require that a building's history outlive individual contractors, architects, and owners. A digital passport ensures instant verifiability of structural compliance, authorized drawings, statutory NOCs, and health inspections for municipal authorities, prospective buyers, financial underwriters, and emergency first responders.

### 3. What information does the passport contain?
* **Core Identity:** Canonical Passport ID (e.g., `BP-2026-04821`), building classification, construction date, built-up area, and unit count.
* **Structural Engineering Specs:** Dual frame system, deep foundation type, fire-resistance rating, exterior envelope cladding, and BIS seismic zone classification.
* **GIS Cadastral Data:** GPS coordinates (latitude/longitude), cadastral survey/CTS plot numbers, and site bounding coordinates.
* **Document Dossier & Blueprints:** Uploaded architectural, structural, MEP drawings, and municipal sanction files.
* **Regulatory Approvals & NOCs:** Statutory clearances (Fire NOC, Environmental, Structural Stability, Occupancy Certificate) with issuing bodies and validity expiry dates.
* **Inspection & Defect Registry:** Certified engineering inspection logs, severity-classified defects, and remediation statuses.
* **Preventative Maintenance Records:** Work orders, contractor invoices, warranty documentation, and expenditures.
* **Immutable Audit Trail:** Append-only ledger of administrative, engineering, and verification events.
* **Public QR Passport:** Privacy-sanitized, cryptographically unguessable verification page.

### 4. Who can access the information?
Access is strictly partitioned using Role-Based Access Control (RBAC):
* **Municipal Administrator (`admin`):** Full administrative control—approves drawings, issues NOCs, registers new buildings, and reviews system audit logs.
* **Structural Engineer (`engineer`):** Logs certified engineering inspections, uploads drawing revisions, and files structural defects.
* **Property Owner (`owner`):** Manages property records, logs maintenance expenditures, uploads owner documents, and initiates identity sandbox verification.
* **Public Citizen (`public` / Unauthenticated):** Accesses read-only, privacy-redacted passport summaries via QR code or public URL.

### 5. How does RBAC work?
RBAC is enforced **server-side** at the API gateway layer using JSON Web Tokens (JWT) and database role verification. When an authenticated request arrives, middleware (`enforceAuth`) decodes the token, verifies cryptographic signature validity, and checks whether the caller's role is in the authorized role whitelist for that endpoint. The frontend UI additionally conditions action buttons and form access based on the verified session, returning clean 403 Forbidden states when unauthorized access is attempted.

### 6. Why did you choose PostgreSQL?
PostgreSQL 17 was chosen because civil building records are fundamentally relational and require strict ACID guarantees:
* Foreign keys ensure referential integrity (e.g., drawings, inspections, and defects cannot exist without a valid parent building).
* Strong typing enforces geometric, timestamp, and numeric precision for civil measurements and compliance scores.
* Relational joins enable single-transaction extraction of the multi-tab building health dossier.
* Enterprise SQL features (indexes, check constraints, JSONB metadata) support both rigid civil specs and extensible audit payloads.

### 7. Why Next.js?
Next.js 16 (App Router) provides a hybrid rendering architecture ideal for this platform:
* **Server-Side Rendering (SSR) & Static Optimization:** Public building passport landing pages pre-render rapidly for mobile visitors scanning QR codes.
* **API Proxy Rewrites:** Transparently proxies `/api/*` and `/uploads/*` requests to the dedicated Express backend and file storage.
* **Modern Developer Experience:** Native TypeScript, React 19 server/client component boundaries, and Tailwind CSS architectural styling.

### 8. Why Express?
Express.js 5 provides a dedicated, lightweight, long-running backend service running on the host server:
* Decouples the persistent civil data services from serverless execution limits and cold starts.
* Manages dedicated database connection pooling (`pg.Pool`) without exhausting database connections.
* Provides fine-grained control over multipart streaming file uploads (`multer`), in-memory sliding window rate limiters, and systemd service lifecycle.

### 9. How are documents stored?
Documents and drawing files are uploaded through authenticated endpoints and stored on persistent disk storage (`/srv/storage/building-passport/`) on the server. The file path, MIME type, file size in bytes, original filename, and cryptographic metadata are persisted in the PostgreSQL `documents` and `drawings` tables. Next.js proxies authenticated access through `/uploads/:filename`.

### 10. How does GIS fit into the system?
Each building record stores spatial metadata including latitude, longitude, cadastral survey number, and city zoning. In the UI, the GIS module renders an interactive locator card linking directly to OpenStreetMap coordinates, enabling municipal inspectors and emergency services to locate the parcel and verify spatial boundaries.

### 11. How are drawing revisions handled?
The drawing service maintains revision histories for architectural, structural, and MEP disciplines. Each revision records a revision code (`R0`, `R1`, `R2`), version number, scale, sheet number, notes, and approval status (`SUBMITTED`, `APPROVED`, `REJECTED`). When an administrator approves a revision, its status is marked `APPROVED` and an immutable `DRAWING_APPROVED` event is recorded in the audit ledger.

### 12. How are NOCs/approvals represented?
The `regulatory_approvals` table tracks statutory clearances including Fire Safety NOC, Structural Stability Certificate, Environmental Clearance, and Occupancy Certificates. Each entry stores the issuing authority, certificate number, validity dates, current status (`ACTIVE`, `EXPIRED`, `PENDING_RENEWAL`), and conditions. The UI displays visual status badges and alert banners for expiring NOCs.

### 13. How does compliance evaluation work?
The Construction Rules & Compliance Engine (`construction-rules-v1.0`) is a 100% deterministic, rule-based evaluator implementing 15 civil engineering rules across 6 categories (Structural, Fire Safety, Documentation, Maintenance, Lifecycle, Occupancy). It processes building specifications and produces deterministic outputs (`PASS`, `WARNING`, `FAIL`, `NOT_ASSESSED`) along with required remediation actions, scoring the building from 0 to 100 without non-deterministic heuristics.

### 14. What is the purpose of the audit trail?
The audit trail (`audit_logs` table) provides an append-only, chronologically indexed ledger of all significant platform operations (building creation, drawing uploads, status changes, NOC issuance, and identity verification attempts). It logs the actor ID, actor name, action type, entity ID, metadata payload, and timestamp, guaranteeing accountability and civil provenance.

### 15. How does QR verification work?
Each building is issued a unique digital passport QR code encoding its canonical public verification URL (`https://mdm-building-passport.vercel.app/public/building/:passportId`). Scanning the QR code with any standard smartphone camera opens the public verification portal without requiring an account or login.

### 16. What information is exposed publicly?
The public passport is strictly sanitized for privacy:
* **Exposed:** Building name, passport ID, classification, address, city, structural frame type, foundation type, fire rating, seismic zone, active approvals/NOCs, and verified building photograph.
* **Redacted:** Private owner contact phone, personal email, financial maintenance costs, internal structural calculation dossiers, confidential blueprints, and internal administrative audit logs.

### 17. How does authentication work?
Authentication is implemented via email/password using bcrypt password hashing (cost factor 10) and signed JWT tokens with 24-hour expiration. Login requests are protected by an in-memory sliding-window IP rate limiter (15 requests/minute). When authenticated, the client stores the token in `localStorage` and transmits it in the `Authorization: Bearer <token>` HTTP header.

### 18. How does email verification work?
Upon registration, the system creates a pending user record, generates a cryptographically secure 32-byte hex verification token and a 6-digit OTP, hashes them using SHA-256 in PostgreSQL, and dispatches an email via the dedicated Gmail SMTP provider. The user confirms their account either by clicking the verification link or submitting the 6-digit OTP.

### 19. What is the Identity Verification Sandbox?
The Owner Identity Verification module operates as an **explicit showcase simulation sandbox**. It models how a national digital identity gateway (such as Aadhaar OTP verification) verifies property title holders without transmitting or storing sensitive government identification numbers. It provides mock OTP hints for testing and issues simulated verification references.

### 20. Is Aadhaar actually integrated?
**No.** Real Aadhaar verification requires an authorized Authentication User Agency (AUA/KUA) license from the Unique Identification Authority of India (UIDAI) and specialized cryptographic hardware security modules (HSM). The platform transparently implements a simulated Sandbox Gateway with explicit disclaimers, avoiding fake API claims while demonstrating the complete user journey and audit logging.

### 21. How would this integrate with government systems in the future?
* **UIDAI / DigiLocker:** By replacing the sandbox provider with an accredited AUA/KUA gateway adapter using certified OAuth 2.0 PKCE and XML digital signature standards.
* **Municipal Urban Local Bodies (ULB):** Via RESTful GIS webhooks exchanging geoJSON parcels with municipal land records (e.g., Bhulekh, Bhoomi).
* **RERA Portals:** Cross-referencing builder registration IDs with state RERA registries for statutory compliance validation.

### 22. What happens if the server goes down?
The Next.js frontend on Vercel's global edge network continues serving static informational pages and will display graceful network disconnect error alerts for API operations. The Express backend on `surya-server` is configured as a `systemd` managed service (`systemctl status building-passport-backend`), which automatically restarts on unexpected process termination.

### 23. What is currently backed up?
* Source code, database schema migrations, automated test suites, and documentation are version-controlled in the Git repository on GitHub.
* Database records currently reside on the live PostgreSQL 17 cluster on Debian Linux. Automated off-site disaster recovery snapshotting is documented as a production recommendation for future deployment.

### 24. What are the known limitations?
1. Automated off-site PostgreSQL disaster recovery snapshots are not yet scheduled.
2. Concurrent drawing revision numbers rely on application-level sequence checking rather than a database unique constraint.
3. Owner identity verification operates in Sandbox mode rather than live UIDAI/DigiLocker.
4. The Cloudflare Quick Tunnel used during server execution is an ephemeral development tunnel whose hostname re-assigns upon tunnel restart; a permanent named tunnel with dedicated DNS is required for permanent production routing.
5. In the demo dataset, `bld_001_apex` is ~95% complete with primary civil specifications, documents, inspections, defects, and maintenance; drawing revisions, approvals, and identity verifications can be demonstrated interactively or viewed in the historical audit records seeded under `bld_002_greenwood`.

### 25. What would you implement next?
1. **Automated Scheduled Database Backups:** Nightly encrypted `pg_dump` backups pushed to off-site S3/B2 storage.
2. **AI Health Assessment Integration:** Connecting sensory IoT telemetry (vibration, strain, crack displacement sensors) to the civil risk engine.
3. **Digital Building Logbook (EU/National Standards):** Energy performance certificates (EPC), carbon embodiment calculations, and demolition recycling audits.
4. **BIM IFC Viewer:** Embedding a 3D architectural viewer (Three.js/web-ifc) to render uploaded IFC CAD models in the browser.
