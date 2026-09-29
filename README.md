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
  - **Dual-Mode Persistence Architecture**: Mongoose database layer connecting to live MongoDB with automated high-fidelity in-memory civil repository fallback when a local MongoDB daemon is not running.
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

### Stage 3 — Building AI Health Prediction System `[PLANNED]`
- **Objective**: Intelligent decision-support engine for structural longevity and proactive risk detection.
- **Planned Functionality**:
  - Multi-parameter neural analysis (photographs, material degradation curves, defect logs, concrete age)
  - Automated **Building Health Score (0-100)** calculation
  - Specific risk sub-scores: Structural Condition, Maintenance Freshness, Water Damage Risk, Corrosion Risk, Repair Priority
  - Automated inspection recommendations for facility managers

---

## 📁 Project Structure

```text
Building passport/
├── public/                    # Static assets & favicons
├── src/
│   ├── app/
│   │   ├── globals.css        # Global CSS, theme variables, blueprint grids & Tailwind directives
│   │   ├── layout.tsx         # Root layout with Geist fonts & SEO metadata
│   │   └── page.tsx           # Main homepage entry point assembling all sections
│   └── components/
│       ├── Navbar.tsx             # Sticky header, brand identity & mobile drawer
│       ├── Hero.tsx               # Title, narrative, CTAs & 3-node system architecture diagram
│       ├── WhatIsPassport.tsx     # Concept analogy matrix & 8 data scope modules
│       ├── WhyPassport.tsx        # Traditional vs. Building Passport comparison
│       ├── HowItWorks.tsx         # 7-phase operational workflow stepper
│       ├── BuildingLifecycle.tsx  # Decadal lifecycle timeline
│       ├── ExamplePassportCard.tsx# Interactive mockup passport (BP-2026-00125 Green Heights)
│       ├── FeaturesSection.tsx    # 8 platform capability cards
│       ├── AIFutureSection.tsx    # Stage 3 AI health engine preview
│       ├── CTASection.tsx         # High-impact minimal conversion section
│       └── Footer.tsx             # System architecture specs & navigation links
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS content paths & theme extensions
├── postcss.config.mjs         # PostCSS configuration with Tailwind CSS & Autoprefixer
├── tsconfig.json              # TypeScript compiler settings
├── prompt.txt                 # Master project specification prompt
└── package.json               # Project dependencies & scripts
```

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **Future Backend**: Node.js + Express.js
- **Future Database**: MongoDB

---

## 💻 Getting Started

### Prerequisites
- Node.js `>= 20.9.0`
- npm `>= 10.0.0`

### Installation & Local Development

1. **Clone or open the repository**:
   ```bash
   cd "Building passport"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

4. **View in Browser**:
   Open [http://localhost:3000](http://localhost:3000) to view the live application.

### Available Scripts

- `npm run dev`: Starts the Next.js development server on port 3000 (front-end + App Router API routes).
- `npm run server`: Starts the standalone Express.js civil backend API on port 5000 (`http://localhost:5000`).
- `npm run build`: Compiles the optimized Next.js production build and typechecks all routes.
- `npm start`: Starts the Next.js production server.
- `npm run lint`: Runs ESLint checks across the codebase.

---

### 🔑 Test & Demo Credentials

Four pre-configured role profiles are accessible via 1-click test buttons on `/login` or manual entry:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `admin@civic.gov.in` | `Admin@2026!` | Full oversight, building registration, inspections, defects, maintenance, blueprints |
| **Structural Engineer** | `engineer@cpwd.gov.in` | `Engineer@2026!` | Log certified inspections, record defects, update defect remediation status |
| **Property Owner** | `owner@apexresidences.in` | `Owner@2026!` | Register building assets, record maintenance expenditure & contractor receipts |
| **Public Verifier** | `public@citizen.in` | `Public@2026!` | View public civil passports, QR scanning (sanitized private data) |

---

## 📜 Standards & Compliance

Designed to align with **ISO 19650** civil building information modeling (BIM) data retention guidelines and digital twin identity standards.
