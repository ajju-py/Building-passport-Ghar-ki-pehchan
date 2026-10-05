# Building Passport — Civil Digital Identity Platform

**Building Passport** is a digital identity and decadal lifecycle management platform for buildings and civil infrastructure. It creates a single, verifiable digital record of identity, structural specifications, inspection logs, defect progression, maintenance history, and predictive building health.

---

## 🏛️ Project Overview

Just like a passport stores the verified identity, background, and travel history of a person, **Building Passport** creates an immutable digital passport for physical buildings.

### Key Data Pillars:
- **Building Identity**: Passport ID, building name, physical coordinates, usage category, and age.
- **Structural Specifications**: Concrete grades, foundation types, steel framing, fire ratings, and exterior cladding.
- **Architectural Plans & Documents**: CAD/BIM drawings, occupancy permits, and environmental certificates.
- **Inspection & Defect Logs**: Geotagged observation photos, severity metrics, and crack monitoring.
- **Maintenance History**: Chronological repair receipts, contractor details, and warranty terms.
- **AI Health Assessment**: Predictive condition scoring and risk analysis (water damage, corrosion, structural degradation).

---

## 🚀 Stages of Development

The project is structured into three major development stages:

### Stage 1 — Public Homepage / Product Website `[COMPLETED & DEPLOY-READY]`
- **Objective**: Establish the platform's visual identity, present core product capabilities, and communicate the decadal lifecycle vision.
- **Key Features**:
  - Sticky minimal navigation with mobile drawer (`Navbar`)
  - Hero section with a 3-node relationship flow (`Physical Building → Digital Passport → Civil Data Repository`)
  - Concept explanation & parallel analogy matrix (`Human Passport vs. Building Passport`)
  - Industry problem vs. solution breakdown
  - Standardized 7-phase civil workflow stepper (`How It Works`)
  - 7-stage decadal timeline (`Design → Construction → Occupancy → Inspection → Maintenance → Renovation → Current Condition`)
  - Interactive sample record mockup (`BP-2026-00125 — Green Heights`) with scannable QR plate modal and tabbed views
  - 8 platform capability cards
  - Stage 3 AI health prediction preview (`Building Health Score: 82/100` with risk sliders)
  - Impactful CTA & civil stack footer
- **Authentication**: *None in Stage 1.* Publicly accessible landing product.

### Stage 2 — Building Profile & Record Management `[COMPLETED & VERIFIED]`
- **Objective**: Civil building management platform with full persistence, JWT authentication, role authorization, QR passport generation, and document registry.
- **Implemented Capabilities**:
  - **Civil Auth & RBAC**: JWT auth with bcrypt password hashing across 4 distinct roles:
    - `admin` (Urban Authority / Superuser): full system oversight
    - `engineer` (Certified Structural Inspector): inspection & defect certification
    - `owner` (Property Owner / Facility Manager): building registration & maintenance logging
    - `public` (Public Citizen / Buyer / Tenant): read-only access to sanitized public passports
  - **PostgreSQL 17 Primary Database**: Full relational persistence via `pg` connection pool with strict schemas across 8 civil tables (`users`, `buildings`, `structural_profiles`, `inspections`, `defects`, `maintenance_records`, `documents`, `photographs`, plus health assessment records).
  - **Dynamic QR Code Generation**: Scannable high-resolution QR passport tokens with official civil branding, resolving to `/public/building/[passportId]`.
  - **Strict Public vs. Private Separation**: Public QR verification masks owner contact numbers, personal identification, and proprietary engineering blueprints.
  - **Multi-Tab Building Profile**:
    - Structural parameters (concrete grade, foundation, seismic zone, framing)
    - Certified inspection records with inspector timestamps
    - Defect log with severity levels (Low, Medium, High, Critical) and status tracking
    - Maintenance history and cumulative expenditure ledger
    - Architectural blueprints & municipal permits registry (`uploads/`)
    - Photo registry with categorised visual inspections
    - High-res digital QR passport plate
    - Printable official civil dossier report
  - **Dual API Support**: Runs both as integrated Next.js App Router API (`http://localhost:3000/api`) and standalone Express.js backend service (`http://localhost:5000/api`).

### Stage 3 — Construction Rules & Compliance Engine `[COMPLETED & VERIFIED]`
- **Objective**: Deterministic civil engineering rules engine evaluating building lifecycle data into actionable compliance statuses (`PASS`, `WARNING`, `FAIL`, `NOT_ASSESSED`).
- **Engine Architecture (`src/lib/construction-rules/`)**:
  - **Rule Registry & Versioning**: Version `construction-rules-v1.0` with statutory decision-support notice.
  - **Zero Side-Effects**: Pure deterministic evaluation layer without machine learning, external dependencies, or database mutations.
  - **Missing Data Strictness**: Missing attributes (e.g. absent concrete grade or unverified fire NOC) strictly yield `NOT_ASSESSED` or `WARNING`—never a false `PASS`.
  - **15 Civil Engineering Rules across 6 Categories**:
    - *Structural*: Frame system validation (`STR-001`), foundation integrity (`STR-002`), concrete grade testing (`STR-003`), seismic zone compatibility (`STR-004`), critical defect structural impact (`STR-005`).
    - *Safety*: Structural fire rating (`SAF-001`), municipal fire safety NOC / permit validity (`SAF-002`).
    - *Documentation*: Architectural blueprint availability (`DOC-001`), structural design dossier (`DOC-002`), geotechnical soil report (`DOC-003`).
    - *Maintenance*: Structural audit recurrence cadence (`MNT-001`), maintenance continuity ledger (`MNT-002`).
    - *Lifecycle*: Structural age vs. condition degradation (`LIF-001`), building envelope durability (`LIF-002`).
    - *Occupancy*: Floor-to-occupancy spatial capacity consistency (`OCC-001`).
  - **Actionable Remediation**: Specific civil engineering corrective actions and evidence traces generated for every failure or warning.
  - **RBAC & Public Privacy**: Protected endpoint `/api/buildings/[id]/construction-rules` accessible strictly to `admin`, `engineer`, and `owner`. Access denied to `public` role to protect sensitive structural vulnerability data.

### Stage 4 — Central Building Record Architecture & National Showcase `[COMPLETED & VERIFIED]`
- **Objective**: Establish a single source of civil truth with cadastral GIS mapping, drawings revision ledger, statutory NOC tracking, simulated identity sandbox, and append-only audit logs.
- **Implemented Capabilities**:
  - **Cadastral GIS & Site Boundary**: Coordinates, plot & survey numbers, OpenStreetMap geocoding, and cadastral parcel polygon metadata.
  - **Drawings & Blueprints Architecture**: Discipline filters (Architectural, Structural, MEP, Fire, As-Built), auto-incrementing revision codes (`R0`, `R1`...), and approval status state machines (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `SUPERSEDED`).
  - **Statutory Approvals & NOCs**: Lifecycle tracking for Building Permissions, Fire Service NOCs, Structural Stability Certificates, and Environmental Clearances.
  - **Owner Identity Verification Sandbox**: Privacy-first simulated e-KYC and DigiLocker property verification gateway displaying masked identifiers (`XXXX-XXXX-8983`) with explicit sandbox disclaimers.
  - **Append-Only Civil Audit Trail**: Chronological immutable action ledger logging all administrative modifications and approvals.
  - **End-to-End Browser QA**: 40 automated Playwright tests verifying Desktop and Mobile journeys with zero test failures.

---

## 📁 Project Structure

```text
Building passport/
├── public/                    # Static assets, branding logos & favicons
├── e2e/                       # Playwright End-to-End browser test suites
│   ├── auth.spec.ts           # Authentication, validation, and session tests
│   ├── building-passport.spec.ts # Central Record, GIS, Drawings, Approvals, Audit
│   ├── homepage.spec.ts       # Branding, navigation, and layout tests
│   ├── public-passport.spec.ts# Public QR and strict privacy redaction tests
│   └── rbac.spec.ts           # Role-based access control and endpoint tests
├── src/
│   ├── app/                   # Next.js App Router (pages and API routes)
│   ├── components/            # UI components and Central Record sections
│   │   ├── brand/             # BuildingPassportLogo brand component
│   │   └── central-record/    # GIS, Drawings, Approvals, Identity, Audit sections
│   ├── context/               # React Context providers (AuthContext)
│   ├── lib/                   # Utility libraries, auth helpers, construction rules
│   ├── server/                # Express backend, domain services, and PostgreSQL db
│   └── types/                 # Civil engineering TypeScript domain models
├── tests/                     # Automated unit and integration test suites
├── next.config.mjs            # Next.js configuration and API proxy rewrites
├── tailwind.config.ts         # Tailwind CSS content paths & theme extensions
├── tsconfig.json              # TypeScript compiler settings
└── package.json               # Project dependencies and test scripts
```

---

## 🏗️ Production Architecture

```text
Browser Client (Desktop / Mobile)
        │
        ▼
Vercel Edge Network (Next.js 16 Frontend)
  https://mdm-building-passport.vercel.app
        │  (Reverse Proxy / API Rewrites)
        ▼
Cloudflare Encrypted Tunnel
        │
        ▼
Debian 13 Linux Host (surya-server)
  ├── Express.js Civil Backend (127.0.0.1:5000, systemd service)
  ├── PostgreSQL 17 Database (127.0.0.1:5432, relational schema)
  ├── Persistent Document Storage (/srv/storage/building-passport/)
  └── Transactional Email Service (Gmail SMTP Provider)
```

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend Service**: Node.js + Express.js (`src/server/express/server.ts`) & Next.js App Router API Routes (`src/app/api/`)
- **Primary Database**: PostgreSQL 17 (`pg` connection pool with strict relational schema)
- **Email Delivery**: Dedicated Gmail SMTP Transactional Email Provider
- **End-to-End Testing**: [Playwright](https://playwright.dev/) (Desktop Chrome & Mobile Chrome)
- **Compliance Engine**: Pure deterministic civil rules evaluator (`construction-rules-v1.0`)

---

## 💻 Getting Started

### Prerequisites
- Node.js `>= 20.9.0`
- npm `>= 10.0.0`
- PostgreSQL `>= 17.0`

### Installation & Local Development

1. **Clone or open the repository**:
   ```bash
   cd "Building passport"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development servers**:
   ```bash
   # Terminal 1: Frontend Dev Server (port 3000)
   npm run dev

   # Terminal 2: Backend API Service (port 5000)
   npm run server
   ```

4. **View in Browser**:
   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev`: Starts the Next.js development server on port 3000 (front-end + App Router API routes).
- `npm run server`: Starts the standalone Express.js backend API on port 5000 (`http://localhost:5000`).
- `npm run build`: Compiles the optimized Next.js production build (28 static & dynamic routes).
- `npm run lint`: Runs ESLint validation across the codebase.
- `npx playwright test`: Runs the 40-test browser E2E suite across Desktop and Mobile viewports.
- `npx tsx tests/central_record.test.ts`: Runs Central Record architecture tests (10 tests).
- `npx tsx tests/phase23_auth.test.ts`: Runs authentication and RBAC verification test suite (46 tests).
- `npx tsx tests/phase3_construction_rules.test.ts`: Runs the Phase 3 Construction Rules & Compliance Engine test suite (56 tests).
- `npx tsx tests/regression.test.ts`: Runs database integrity & regression test suite (30 tests).
- `npx tsx tests/email_verification.test.ts`: Runs transactional email verification tests (27 tests).

---

### 🔑 Test & Demo Profiles

Pre-configured role profiles are available via 1-click quick demo buttons on `/login` or through credentials configured in your environment:

| Role | Profile Identifier | Description | Capabilities |
| :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `admin@buildingpassport.org` | Chief Municipal Engineer | Full system oversight, building registration, drawings approval, statutory NOCs, and system audit logs |
| **Structural Engineer** | `engineer@buildingpassport.org` | Licensed Structural Auditor | Inspections certification, drawing revision registration, defect logging, and remediation tracking |
| **Property Owner** | `owner@buildingpassport.org` | Title Holder / Facility Manager | Asset management, maintenance logging, document uploads, and identity sandbox verification |
| **Public Citizen** | Unauthenticated | Citizen / Tenant / Buyer | Read-only access to sanitized public building passports via QR codes without authentication |

---

## 📜 Standards & Compliance

Designed to align with **ISO 19650** civil building information modeling (BIM) data retention guidelines and digital building logbook standards.
