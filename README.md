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

### Stage 2 — Building Profile & Record Management `[PLANNED]`
- **Objective**: Introduce backend data persistence and user management to create and manage live building passports.
- **Planned Functionality**:
  - Building registration forms & automated QR token generation
  - Architectural blueprint & PDF document uploads
  - Builder, developer & owner profile links
  - Interactive maintenance log input & cost ledger
  - Node.js + Express.js API backend integration
  - MongoDB database schemas for civil records

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

- `npm run dev`: Starts the Next.js development server on port 3000.
- `npm run build`: Compiles the optimized production build.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint checks across the codebase.

---

## 📜 Standards & Compliance

Designed to align with **ISO 19650** civil building information modeling (BIM) data retention guidelines and digital twin identity standards.
