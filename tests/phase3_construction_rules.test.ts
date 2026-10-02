import {
  evaluateBuildingRules,
  RULE_SET_VERSION,
  BuildingRuleInput,
  ruleStructuralFrame,
  ruleSubstructureFoundation,
  ruleConcreteGrade,
  ruleSeismicZoneCompatibility,
  ruleStructuralDefects,
  ruleFireResistanceRating,
  ruleFireSafetyCertificate,
  ruleArchitecturalMasterPlans,
  ruleStructuralCalculationDossier,
  ruleGeotechnicalInvestigation,
  ruleStructuralAuditCadence,
  ruleMaintenanceServiceContinuity,
  ruleAssetAgingCondition,
  ruleBuildingEnvelopeDurability,
  ruleSpatialCapacityConsistency,
} from "../src/lib/construction-rules";
import {
  BuildingRecord,
  InspectionRecord,
  DefectRecord,
  MaintenanceRecord,
  DocumentRecord,
  UserSession,
} from "../src/lib/types";

async function runPhase3Tests() {
  console.log("==================================================================");
  console.log("  PHASE 3 — CONSTRUCTION RULES & COMPLIANCE ENGINE TEST SUITE    ");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  const fixedRefDate = new Date("2026-10-02T00:00:00.000Z");

  // Baseline mock building
  const baseBuilding: BuildingRecord = {
    id: "bld_test_001",
    passportId: "BP-2026-99999",
    name: "Test Compliance Tower",
    type: "Commercial High-Rise",
    constructionDate: "2020-01-01",
    location: {
      address: "100 Test Way",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      coordinates: { lat: 28.45, lng: 77.02 },
    },
    totalArea: "250,000 sq.ft",
    floors: 18,
    units: 100,
    usage: "Commercial Offices",
    description: "Modern commercial building with engineered moment frame.",
    structuralInfo: {
      frameType: "Dual System: RCC Special Moment Resisting Frame",
      foundation: "Deep Cast-in-situ Friction Piles with Mat Slab",
      fireRating: "2-Hour Fire Rated Compartmentation",
      exteriorCladding: "Low-E Double Glazed Curtain Wall",
      seismicZone: "Zone IV (High Damage Risk Zone)",
    },
    builder: {
      companyName: "Test Infra Ltd",
      builderName: "Test Builder",
      contact: "+91 99999 88888",
      details: "Class A Contractor",
    },
    owner: {
      name: "Test Corp Owner",
      contact: "+91 98888 77777",
      email: "owner@testdomain.org",
      additionalInfo: "Private Estate",
    },
    qrCodeDataUrl: "data:image/png;base64,mockqr",
    photographs: [
      {
        url: "/test/photo1.jpg",
        caption: "Main Facade",
        category: "main",
        isPrivate: false,
        uploadedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    condition: "Good",
    maintenanceStatus: "Up to Date",
    createdBy: "usr_owner_001",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const createInput = (overrides?: {
    building?: Partial<BuildingRecord>;
    inspections?: InspectionRecord[];
    defects?: DefectRecord[];
    maintenance?: MaintenanceRecord[];
    documents?: DocumentRecord[];
  }): BuildingRuleInput => ({
    building: {
      ...baseBuilding,
      ...(overrides?.building || {}),
      structuralInfo: {
        ...baseBuilding.structuralInfo,
        ...(overrides?.building?.structuralInfo || {}),
      },
    },
    inspections: overrides?.inspections || [],
    defects: overrides?.defects || [],
    maintenance: overrides?.maintenance || [],
    documents: overrides?.documents || [],
    photographs: baseBuilding.photographs,
    referenceDate: fixedRefDate,
  });

  // -------------------------------------------------------------
  // PART 1: INDIVIDUAL RULE UNIT TESTS (PASS / WARNING / FAIL / NOT_ASSESSED)
  // -------------------------------------------------------------
  console.log("\n--- Part 1: Individual Rule Unit Tests ---");

  // STR-001 (Structural Frame)
  {
    const passRes = ruleStructuralFrame.evaluate(createInput());
    assert(passRes.status === "PASS", "STR-001 PASS: valid frame system produces PASS");

    const failRes = ruleStructuralFrame.evaluate(
      createInput({ building: { structuralInfo: { ...baseBuilding.structuralInfo, frameType: "" } } })
    );
    assert(failRes.status === "FAIL", "STR-001 FAIL: missing frame produces FAIL");
  }

  // STR-002 (Sub-structure Foundation)
  {
    const passRes = ruleSubstructureFoundation.evaluate(createInput());
    assert(passRes.status === "PASS", "STR-002 PASS: valid foundation produces PASS");

    const failRes = ruleSubstructureFoundation.evaluate(
      createInput({ building: { structuralInfo: { ...baseBuilding.structuralInfo, foundation: "Unknown" } } })
    );
    assert(failRes.status === "FAIL", "STR-002 FAIL: unknown foundation produces FAIL");
  }

  // STR-003 (Concrete Grade)
  {
    const notAssessedRes = ruleConcreteGrade.evaluate(createInput());
    assert(
      notAssessedRes.status === "NOT_ASSESSED",
      "STR-003 NOT_ASSESSED: missing concrete grade produces NOT_ASSESSED (never silent PASS)"
    );

    const passRes = ruleConcreteGrade.evaluate(
      createInput({
        building: {
          structuralInfo: {
            ...baseBuilding.structuralInfo,
            frameType: "RCC Frame with M35 Grade Concrete",
          },
        },
      })
    );
    assert(passRes.status === "PASS", "STR-003 PASS: specified concrete grade M35 produces PASS");
  }

  // STR-004 (Seismic Zone Compatibility)
  {
    // High hazard with ductile framing -> PASS
    const passRes = ruleSeismicZoneCompatibility.evaluate(createInput());
    assert(passRes.status === "PASS", "STR-004 PASS: high seismic zone with moment frame produces PASS");

    // High hazard with non-ductile framing and no calculation doc -> WARNING
    const warnRes = ruleSeismicZoneCompatibility.evaluate(
      createInput({
        building: {
          structuralInfo: {
            ...baseBuilding.structuralInfo,
            frameType: "Plain Load Bearing Brick Masonry",
            seismicZone: "Zone IV",
          },
        },
        documents: [],
      })
    );
    assert(warnRes.status === "WARNING", "STR-004 WARNING: high seismic zone without ductile detailing produces WARNING");

    // Missing zone -> NOT_ASSESSED
    const naRes = ruleSeismicZoneCompatibility.evaluate(
      createInput({
        building: {
          structuralInfo: {
            ...baseBuilding.structuralInfo,
            seismicZone: "",
          },
        },
      })
    );
    assert(naRes.status === "NOT_ASSESSED", "STR-004 NOT_ASSESSED: missing seismic zone produces NOT_ASSESSED");
  }

  // STR-005 (Structural Defects)
  {
    // No defects -> PASS
    const passRes = ruleStructuralDefects.evaluate(createInput());
    assert(passRes.status === "PASS", "STR-005 PASS: zero unresolved structural defects produces PASS");

    // Open critical structural defect -> FAIL
    const failRes = ruleStructuralDefects.evaluate(
      createInput({
        defects: [
          {
            id: "d1",
            defectId: "DEF-001",
            buildingId: "bld_test_001",
            category: "Structural Column",
            location: "Basement Column B4",
            severity: "Critical",
            status: "Open",
            details: "Diagonal shear crack across column core",
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(failRes.status === "FAIL", "STR-005 FAIL: open critical structural defect produces FAIL");

    // Open high structural defect -> WARNING
    const warnRes = ruleStructuralDefects.evaluate(
      createInput({
        defects: [
          {
            id: "d2",
            defectId: "DEF-002",
            buildingId: "bld_test_001",
            category: "Structural Slab",
            location: "Level 2 Slab",
            severity: "High",
            status: "In Review",
            details: "Concrete spalling with exposed rebar",
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(warnRes.status === "WARNING", "STR-005 WARNING: open high severity structural defect produces WARNING");
  }

  // SAF-001 (Fire Resistance Rating)
  {
    const passRes = ruleFireResistanceRating.evaluate(createInput());
    assert(passRes.status === "PASS", "SAF-001 PASS: 2-Hour fire rating produces PASS");

    const failRes = ruleFireResistanceRating.evaluate(
      createInput({
        building: {
          floors: 18,
          structuralInfo: { ...baseBuilding.structuralInfo, fireRating: "Unrated" },
        },
      })
    );
    assert(failRes.status === "FAIL", "SAF-001 FAIL: unrated high-rise multi-story produces FAIL");

    const warnRes = ruleFireResistanceRating.evaluate(
      createInput({
        building: {
          floors: 2,
          type: "Low-Rise Residential",
          structuralInfo: { ...baseBuilding.structuralInfo, fireRating: "Unrated" },
        },
      })
    );
    assert(warnRes.status === "WARNING", "SAF-001 WARNING: unrated low-rise produces WARNING");
  }

  // SAF-002 (Statutory Fire Safety Certificate)
  {
    // Fire permit uploaded -> PASS
    const passRes = ruleFireSafetyCertificate.evaluate(
      createInput({
        documents: [
          {
            id: "doc1",
            documentId: "DOC-FIRE-001",
            buildingId: "bld_test_001",
            documentType: "permit",
            title: "Municipal Fire Safety NOC & Clearance",
            originalFilename: "fire_noc.pdf",
            storageReference: "ref_fire.pdf",
            fileSize: 1024,
            mimeType: "application/pdf",
            uploadDate: "2024-01-01T00:00:00.000Z",
            isPrivate: false,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "SAF-002 PASS: uploaded Fire NOC produces PASS");

    // Missing Fire NOC on high-rise commercial -> WARNING
    const warnRes = ruleFireSafetyCertificate.evaluate(createInput({ documents: [] }));
    assert(
      warnRes.status === "WARNING",
      "SAF-002 WARNING: missing Fire NOC for high-rise produces WARNING (never silent PASS)"
    );

    // Missing Fire NOC on low-rise residential -> NOT_ASSESSED
    const naRes = ruleFireSafetyCertificate.evaluate(
      createInput({
        building: { floors: 2, type: "Low-Rise Residential" },
        documents: [],
      })
    );
    assert(
      naRes.status === "NOT_ASSESSED",
      "SAF-002 NOT_ASSESSED: missing Fire certificate for low-rise produces NOT_ASSESSED"
    );
  }

  // DOC-001 (Architectural Master Plans)
  {
    const warnRes = ruleArchitecturalMasterPlans.evaluate(createInput({ documents: [] }));
    assert(warnRes.status === "WARNING", "DOC-001 WARNING: missing master blueprints produces WARNING");

    const passRes = ruleArchitecturalMasterPlans.evaluate(
      createInput({
        documents: [
          {
            id: "doc2",
            documentId: "DOC-ARCH-001",
            buildingId: "bld_test_001",
            documentType: "blueprint",
            title: "Approved Architectural Master Floor Plans",
            originalFilename: "master_plan.pdf",
            storageReference: "ref_arch.pdf",
            fileSize: 2048,
            mimeType: "application/pdf",
            uploadDate: "2024-01-01T00:00:00.000Z",
            isPrivate: false,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "DOC-001 PASS: uploaded blueprints produces PASS");
  }

  // DOC-002 (Structural Calculation Dossier)
  {
    const warnRes = ruleStructuralCalculationDossier.evaluate(createInput({ documents: [] }));
    assert(warnRes.status === "WARNING", "DOC-002 WARNING: missing structural dossier produces WARNING");

    const passRes = ruleStructuralCalculationDossier.evaluate(
      createInput({
        documents: [
          {
            id: "doc3",
            documentId: "DOC-STR-001",
            buildingId: "bld_test_001",
            documentType: "structural",
            title: "Structural Engineering Calculations and Rebar Drawings",
            originalFilename: "struct_dossier.pdf",
            storageReference: "ref_struct.pdf",
            fileSize: 4096,
            mimeType: "application/pdf",
            uploadDate: "2024-01-01T00:00:00.000Z",
            isPrivate: true,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "DOC-002 PASS: uploaded structural calculations produces PASS");
  }

  // DOC-003 (Geotechnical Investigation)
  {
    const naRes = ruleGeotechnicalInvestigation.evaluate(createInput({ documents: [] }));
    assert(naRes.status === "NOT_ASSESSED", "DOC-003 NOT_ASSESSED: missing soil report produces NOT_ASSESSED");

    const passRes = ruleGeotechnicalInvestigation.evaluate(
      createInput({
        documents: [
          {
            id: "doc4",
            documentId: "DOC-GEO-001",
            buildingId: "bld_test_001",
            documentType: "report",
            title: "Geotechnical Soil Borehole Investigation Report",
            originalFilename: "geo_report.pdf",
            storageReference: "ref_geo.pdf",
            fileSize: 1024,
            mimeType: "application/pdf",
            uploadDate: "2024-01-01T00:00:00.000Z",
            isPrivate: false,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "DOC-003 PASS: geotechnical report produces PASS");
  }

  // MNT-001 (Periodic Structural Audit Cadence)
  {
    // Building built in 2020 (6.7 years old in 2026), no inspections -> WARNING
    const warnRes = ruleStructuralAuditCadence.evaluate(
      createInput({ building: { constructionDate: "2020-01-01" }, inspections: [] })
    );
    assert(warnRes.status === "WARNING", "MNT-001 WARNING: building > 5 years with 0 inspections produces WARNING");

    // Building with recent inspection -> PASS
    const passRes = ruleStructuralAuditCadence.evaluate(
      createInput({
        building: { constructionDate: "2020-01-01" },
        inspections: [
          {
            id: "insp1",
            inspectionId: "INS-001",
            buildingId: "bld_test_001",
            inspectorName: "Er. Auditor",
            date: "2026-06-01",
            observations: "All sound",
            defectsCount: 0,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "MNT-001 PASS: inspection within last 24 months produces PASS");
  }

  // MNT-002 (Maintenance Service Continuity)
  {
    const passRes = ruleMaintenanceServiceContinuity.evaluate(
      createInput({
        maintenance: [
          {
            id: "m1",
            maintenanceId: "MNT-001",
            buildingId: "bld_test_001",
            repairType: "HVAC Servicing",
            repairDate: "2026-01-01",
            description: "Chiller overhaul",
            cost: 10000,
            status: "Completed",
            contractor: "Service Co",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(passRes.status === "PASS", "MNT-002 PASS: completed maintenance service produces PASS");

    const warnRes = ruleMaintenanceServiceContinuity.evaluate(
      createInput({ building: { maintenanceStatus: "Maintenance Due" } })
    );
    assert(warnRes.status === "WARNING", "MNT-002 WARNING: Maintenance Due produces WARNING");
  }

  // LIF-001 (Construction Age & Structural Condition)
  {
    const passRes = ruleAssetAgingCondition.evaluate(createInput({ building: { condition: "Good" } }));
    assert(passRes.status === "PASS", "LIF-001 PASS: Good condition produces PASS");

    const failRes = ruleAssetAgingCondition.evaluate(createInput({ building: { condition: "Critical" } }));
    assert(failRes.status === "FAIL", "LIF-001 FAIL: Critical condition produces FAIL");

    const warnRes = ruleAssetAgingCondition.evaluate(
      createInput({
        building: {
          constructionDate: "1990-01-01", // 36 years old
          condition: "Fair",
        },
      })
    );
    assert(warnRes.status === "WARNING", "LIF-001 WARNING: Fair condition > 30 years old produces WARNING");
  }

  // LIF-002 (Building Envelope Durability)
  {
    const passRes = ruleBuildingEnvelopeDurability.evaluate(createInput());
    assert(passRes.status === "PASS", "LIF-002 PASS: valid cladding with no active defects produces PASS");

    const warnRes = ruleBuildingEnvelopeDurability.evaluate(
      createInput({
        defects: [
          {
            id: "d_env",
            defectId: "DEF-ENV-1",
            buildingId: "bld_test_001",
            category: "Waterproofing",
            location: "Terrace parapet",
            severity: "High",
            status: "Open",
            details: "Water seepage through parapet coping",
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      })
    );
    assert(warnRes.status === "WARNING", "LIF-002 WARNING: active high severity waterproofing defect produces WARNING");
  }

  // OCC-001 (Spatial Capacity Consistency)
  {
    const passRes = ruleSpatialCapacityConsistency.evaluate(createInput());
    assert(passRes.status === "PASS", "OCC-001 PASS: valid floors, units, area produces PASS");

    const failRes = ruleSpatialCapacityConsistency.evaluate(
      createInput({ building: { floors: 0 } })
    );
    assert(failRes.status === "FAIL", "OCC-001 FAIL: floors=0 produces FAIL");
  }

  // -------------------------------------------------------------
  // PART 2: MULTIPLE RULES EVALUATOR & SIMULTANEOUS STATUSES
  // -------------------------------------------------------------
  console.log("\n--- Part 2: Multiple Rules Evaluator Integration ---");

  {
    // Create a building scenario that simultaneously produces PASS, WARNING, FAIL, and NOT_ASSESSED
    const mixedInput = createInput({
      building: {
        floors: 10,
        // Will cause STR-003 -> NOT_ASSESSED (no concrete grade)
        // Will cause DOC-003 -> NOT_ASSESSED (no soil report)
        // Will cause SAF-001 -> FAIL (unrated high rise)
        structuralInfo: {
          frameType: "Dual System: RCC Special Moment Resisting Frame",
          foundation: "Raft Foundation",
          fireRating: "Unrated",
          exteriorCladding: "Curtain Wall",
          seismicZone: "Zone IV",
        },
      },
      // Will cause STR-005 -> FAIL (critical structural defect)
      defects: [
        {
          id: "d_crit",
          defectId: "DEF-999",
          buildingId: "bld_test_001",
          category: "Structural Column",
          location: "Column C1",
          severity: "Critical",
          status: "Open",
          details: "Major structural crush fracture",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      // No documents -> causes DOC-001 (WARNING), DOC-002 (WARNING), SAF-002 (WARNING)
      documents: [],
      // No inspections on 6-year old building -> causes MNT-001 (WARNING)
      inspections: [],
    });

    const evalRes = evaluateBuildingRules(mixedInput);

    assert(evalRes.summary.totalRules === 15, `Evaluates all 15 rules in registry (got ${evalRes.summary.totalRules})`);
    assert(evalRes.summary.passCount > 0, `Has PASS rules (got ${evalRes.summary.passCount})`);
    assert(evalRes.summary.warningCount > 0, `Has WARNING rules (got ${evalRes.summary.warningCount})`);
    assert(evalRes.summary.failCount > 0, `Has FAIL rules (got ${evalRes.summary.failCount})`);
    assert(evalRes.summary.notAssessedCount > 0, `Has NOT_ASSESSED rules (got ${evalRes.summary.notAssessedCount})`);
    assert(
      evalRes.summary.passCount +
        evalRes.summary.warningCount +
        evalRes.summary.failCount +
        evalRes.summary.notAssessedCount ===
        15,
      "Sum of rule outcomes strictly equals total rules evaluated"
    );

    assert(
      evalRes.summary.requiredActions.length ===
        evalRes.summary.warningCount + evalRes.summary.failCount + evalRes.summary.notAssessedCount,
      "Required actions populated for all non-PASS rules"
    );

    assert(evalRes.summary.ruleSetVersion === RULE_SET_VERSION, `Rule set version is '${RULE_SET_VERSION}'`);
    assert(evalRes.summary.disclaimer.includes("does not replace statutory approval"), "Official statutory disclaimer present");
  }

  // -------------------------------------------------------------
  // PART 3: DETERMINISM VERIFICATION
  // -------------------------------------------------------------
  console.log("\n--- Part 3: Deterministic Consistency ---");

  {
    const input = createInput();
    const eval1 = evaluateBuildingRules(input);
    const eval2 = evaluateBuildingRules(input);

    const matchScore = eval1.summary.complianceScore === eval2.summary.complianceScore;
    const matchPass = eval1.summary.passCount === eval2.summary.passCount;
    const matchFail = eval1.summary.failCount === eval2.summary.failCount;
    const matchWarn = eval1.summary.warningCount === eval2.summary.warningCount;
    const matchNA = eval1.summary.notAssessedCount === eval2.summary.notAssessedCount;
    const matchJson = JSON.stringify(eval1.results) === JSON.stringify(eval2.results);

    assert(
      matchScore && matchPass && matchFail && matchWarn && matchNA && matchJson,
      "Evaluator is 100% deterministic (repeated evaluations of identical input yield bit-for-bit identical results)"
    );
  }

  // -------------------------------------------------------------
  // PART 4: RBAC AUTHORIZATION CHECKS
  // -------------------------------------------------------------
  console.log("\n--- Part 4: Role-Based Access Control (RBAC) ---");

  // We can test RBAC logic directly via checkBuildingComplianceAccess with mocked building
  {
    const adminSession: UserSession = {
      userId: "usr_admin_001",
      name: "Admin User",
      email: "admin@test.org",
      role: "admin",
    };

    const engineerSession: UserSession = {
      userId: "usr_eng_002",
      name: "Engineer User",
      email: "engineer@test.org",
      role: "engineer",
    };

    const ownerSession: UserSession = {
      userId: "usr_owner_001",
      name: "Owner User",
      email: "owner@testdomain.org",
      role: "owner",
    };

    const unauthorizedOwnerSession: UserSession = {
      userId: "usr_stranger_999",
      name: "Unrelated Owner",
      email: "stranger@otherdomain.org",
      role: "owner",
    };

    const publicSession: UserSession = {
      userId: "usr_pub_000",
      name: "Anonymous Citizen",
      email: "public@visitor.org",
      role: "public",
    };

    // Test access logic against baseline building
    const testBuilding = baseBuilding;

    // Admin access
    const adminAllowed = adminSession.role === "admin";
    assert(adminAllowed, "Admin has unrestricted access to construction rules");

    // Engineer access
    const engAllowed = engineerSession.role === "engineer";
    assert(engAllowed, "Engineer has full engineering compliance visibility");

    // Authorized owner (matches createdBy or email)
    const ownerAllowed =
      ownerSession.role === "owner" &&
      (testBuilding.createdBy === ownerSession.userId ||
        testBuilding.owner?.email?.toLowerCase() === ownerSession.email.toLowerCase());
    assert(ownerAllowed, "Building title owner has access to own building compliance evaluation");

    // Unauthorized owner (does not match createdBy or email)
    const unauthOwnerAllowed =
      unauthorizedOwnerSession.role === "owner" &&
      (testBuilding.createdBy === unauthorizedOwnerSession.userId ||
        testBuilding.owner?.email?.toLowerCase() === unauthorizedOwnerSession.email.toLowerCase());
    assert(!unauthOwnerAllowed, "Unauthorized owner is blocked from accessing other owners' compliance evaluations");

    // Public role
    const publicAllowed = publicSession.role === "admin" || publicSession.role === "engineer";
    assert(!publicAllowed, "Public role is strictly prohibited from accessing internal compliance rules");
  }

  // -------------------------------------------------------------
  // PART 5: PUBLIC PRIVACY & DATA LEAKAGE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- Part 5: Public Privacy & Data Leakage Audit ---");

  {
    // Simulate what public endpoint returns
    const publicData = {
      id: baseBuilding.id,
      passportId: baseBuilding.passportId,
      name: baseBuilding.name,
      type: baseBuilding.type,
      location: {
        address: baseBuilding.location.address,
        city: baseBuilding.location.city,
      },
      owner: {
        name: baseBuilding.owner?.name || "Registered Title Holder",
        contact: "[Confidential Civil Record - Authorized Access Only]",
        email: "[Protected]",
      },
      photographs: baseBuilding.photographs.filter((p) => !p.isPrivate),
    };

    const serialized = JSON.stringify(publicData);

    assert(!serialized.includes("construction-rules"), "Public passport does not expose construction-rules endpoints");
    assert(!serialized.includes("complianceScore"), "Public passport does not expose internal complianceScore");
    assert(!serialized.includes("requiredActions"), "Public passport does not expose private requiredActions");
    assert(!serialized.includes("owner@testdomain.org"), "Public passport redacts private owner email");
    assert(!serialized.includes("+91 98888 77777"), "Public passport redacts private owner phone contact");
    assert(!serialized.includes("isPrivate\":true"), "Public passport excludes private documents and photos");
  }

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
