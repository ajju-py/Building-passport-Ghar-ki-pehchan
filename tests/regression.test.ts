import dotenv from "dotenv";
import path from "path";
import { query } from "../src/server/db/postgres";
import { BuildingService } from "../src/server/services/building.service";
import { extractCivilHealthFeatures } from "../src/server/services/health/featureExtractor.service";
import { calculateHealthAssessment } from "../src/server/services/health/riskEngine.service";
import { AssessmentService } from "../src/server/services/health/assessment.service";
import { UserSession } from "../src/lib/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runRegression() {
  console.log("==================================================");
  console.log("    STAGE 2 & STAGE 3 FULL REGRESSION SUITE       ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const adminSession: UserSession = {
    userId: "usr_admin_001",
    email: "admin@buildingpassport.org",
    role: "admin",
    name: "System Administrator",
  };

  let testAssessmentId: string | null = null;

  try {
    // -------------------------------------------------------------
    // 1. STAGE 2 CIVIL REPOSITORIES & SERVICES REGRESSION
    // -------------------------------------------------------------
    console.log("\n--- 1. Stage 2 Civil Core Services ---");

    // Buildings
    const buildings = await BuildingService.getBuildings(adminSession);
    assert(buildings.length === 3, "BuildingService.getBuildings returns 3 baseline buildings");
    assert(buildings[0].passportId.startsWith("BP-"), "Passport ID format valid");
    assert(buildings[0].photographs.length >= 1, "Building photographs mapped correctly");

    const singleBuilding = await BuildingService.getBuildingById(buildings[0].id, adminSession);
    assert(!!singleBuilding && singleBuilding.id === buildings[0].id, "BuildingService.getBuildingById retrieves specific building");

    // Public QR verification
    const publicPassport = await BuildingService.getPublicPassport(buildings[0].passportId);
    assert(!!publicPassport && publicPassport.passportId === buildings[0].passportId, "Public passport resolution without auth works");

    // Core entity table counts
    const inspectionsRes = await query<{ c: number }>("SELECT count(*)::int as c FROM inspections;");
    assert(inspectionsRes.rows[0].c === 3, "Inspections table has 3 baseline records");

    const defectsRes = await query<{ c: number }>("SELECT count(*)::int as c FROM defects;");
    assert(defectsRes.rows[0].c === 3, "Defects table has 3 baseline records");

    const maintenanceRes = await query<{ c: number }>("SELECT count(*)::int as c FROM maintenance;");
    assert(maintenanceRes.rows[0].c === 3, "Maintenance table has 3 baseline records");

    const documentsRes = await query<{ c: number }>("SELECT count(*)::int as c FROM documents;");
    assert(documentsRes.rows[0].c === 3, "Documents table has 3 baseline records");

    // -------------------------------------------------------------
    // 2. STAGE 3 CIVIL FEATURE EXTRACTION & RISK ENGINE REGRESSION
    // -------------------------------------------------------------
    console.log("\n--- 2. Stage 3 Civil Health Extraction & Risk Engine ---");

    const targetBuildingId = buildings[0].id;
    const features = await extractCivilHealthFeatures(targetBuildingId);
    assert(!!features, "Civil feature extraction succeeded for building");
    assert(features !== null && features.lifecycle.buildingAgeYears !== null && features.lifecycle.buildingAgeYears >= 0, "Lifecycle features: buildingAgeYears valid");
    assert(features !== null && typeof features.defects.openCount === "number", "Defect features: openCount valid");
    assert(features !== null && typeof features.inspections.totalInspections === "number", "Inspection features: totalInspections valid");
    assert(features !== null && features.dataQuality.dataCompletenessScore >= 0 && features.dataQuality.dataCompletenessScore <= 100, "Data completeness score valid (0 to 100)");

    if (features) {
      const calculation = calculateHealthAssessment(features);
      assert(calculation.modelVersion === "bp-rules-v1.0", "Model version is 'bp-rules-v1.0'");
      assert(calculation.engineType === "rule_based_deterministic", "Engine type is 'rule_based_deterministic'");
      assert(
        calculation.overallScore >= 0 && calculation.overallScore <= 100,
        `Overall score within valid bounds [0, 100]: ${calculation.overallScore}`
      );
      assert(
        ["Low", "Moderate", "Elevated", "High", "Critical"].includes(calculation.riskLevel),
        `Risk level canonical: ${calculation.riskLevel}`
      );
      assert(calculation.categoryScores.structural >= 0 && calculation.categoryScores.structural <= 100, "Structural category score valid");
      assert(calculation.categoryScores.defectBurden >= 0 && calculation.categoryScores.defectBurden <= 100, "Defect burden category score valid");
      assert(calculation.categoryScores.maintenance >= 0 && calculation.categoryScores.maintenance <= 100, "Maintenance category score valid");
      assert(calculation.categoryScores.safety >= 0 && calculation.categoryScores.safety <= 100, "Fire life safety category score valid");
      assert(calculation.categoryScores.lifecycle >= 0 && calculation.categoryScores.lifecycle <= 100, "Lifecycle category score valid");
      assert(calculation.categoryScores.documentation >= 0 && calculation.categoryScores.documentation <= 100, "Documentation category score valid");

      // -------------------------------------------------------------
      // 3. HEALTH ASSESSMENT PERSISTENCE & RETRIEVAL REGRESSION
      // -------------------------------------------------------------
      console.log("\n--- 3. Assessment Persistence, Retrieval & Cleanup ---");

      const persisted = await AssessmentService.calculateAndPersistAssessment(targetBuildingId, {
        assessedBy: "usr_eng_002",
      });
      testAssessmentId = persisted.id;

      assert(!!persisted.id, "Health assessment successfully persisted to PostgreSQL");
      assert(persisted.overallScore === calculation.overallScore, "Persisted score matches calculation");
      assert(persisted.riskLevel === calculation.riskLevel, "Persisted riskLevel matches calculation");

      // Latest retrieval
      const latest = await AssessmentService.getLatestAssessmentByBuilding(targetBuildingId);
      assert(!!latest && latest.id === persisted.id, "Latest assessment retrieved correctly");

      // Historical retrieval
      const history = await AssessmentService.getAssessmentsByBuilding(targetBuildingId);
      assert(history.length >= 1 && history[0].id === persisted.id, "Assessment history retrieved with correct ordering");
    }

  } finally {
    // Clean up temporary assessment record
    if (testAssessmentId) {
      await query("DELETE FROM health_assessments WHERE id = $1;", [testAssessmentId]);
      console.log("\n[Teardown] Temporary assessment record deleted.");
    }

    // Baseline count verification
    console.log("\n--- 4. Post-Regression Database Baseline Check ---");
    const baselineCounts: Record<string, number> = {
      users: 3,
      buildings: 3,
      building_photographs: 4,
      inspections: 3,
      defects: 3,
      maintenance: 3,
      documents: 3,
      health_assessments: 0,
    };

    let baselinePreserved = true;
    for (const [table, expected] of Object.entries(baselineCounts)) {
      const res = await query<{ c: number }>(`SELECT count(*)::int as c FROM ${table};`);
      const actual = res.rows[0].c;
      const match = actual === expected;
      if (!match) baselinePreserved = false;
      console.log(`Table ${table.padEnd(22)}: ${actual} (expected: ${expected}) -> ${match ? "MATCH" : "MISMATCH"}`);
    }

    assert(baselinePreserved, "All 8 database baseline tables strictly preserved");
  }

  console.log("\n==================================================");
  console.log(`REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRegression().catch((err) => {
  console.error("Regression error:", err);
  process.exit(1);
});
