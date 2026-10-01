import crypto from "crypto";
import { query } from "@/server/db/postgres";
import { HealthAssessmentDbRow, mapHealthAssessmentRow } from "@/server/db/mappers";
import {
  HealthAssessmentCalculation,
  HealthAssessmentRecord,
  RiskLevel,
  UserSession,
} from "@/lib/types";
import { extractCivilHealthFeatures } from "./featureExtractor.service";
import { calculateHealthAssessment } from "./riskEngine.service";
import { BuildingService } from "../building.service";

export class AssessmentService {
  private static readonly VALID_RISK_LEVELS: ReadonlySet<RiskLevel> = new Set([
    "Low",
    "Moderate",
    "Elevated",
    "High",
    "Critical",
  ]);

  /**
   * Validates in-memory HealthAssessmentCalculation domain constraints before persistence.
   */
  public static validateCalculation(calculation: HealthAssessmentCalculation): void {
    if (
      typeof calculation.overallScore !== "number" ||
      !Number.isFinite(calculation.overallScore) ||
      calculation.overallScore < 0 ||
      calculation.overallScore > 100
    ) {
      throw new Error(
        `Validation Error: overallScore must be a finite number between 0 and 100. Got: ${calculation.overallScore}`
      );
    }

    if (!this.VALID_RISK_LEVELS.has(calculation.riskLevel)) {
      throw new Error(
        `Validation Error: riskLevel must be one of 'Low', 'Moderate', 'Elevated', 'High', 'Critical'. Got: '${calculation.riskLevel}'`
      );
    }

    if (
      !calculation.modelVersion ||
      typeof calculation.modelVersion !== "string" ||
      calculation.modelVersion.trim().length === 0
    ) {
      throw new Error("Validation Error: modelVersion is required.");
    }

    if (
      !calculation.engineType ||
      typeof calculation.engineType !== "string" ||
      calculation.engineType.trim().length === 0
    ) {
      throw new Error("Validation Error: engineType is required.");
    }

    if (
      !calculation.buildingId ||
      typeof calculation.buildingId !== "string" ||
      calculation.buildingId.trim().length === 0
    ) {
      throw new Error("Validation Error: buildingId is required.");
    }

    if (
      typeof calculation.dataCompletenessScore !== "number" ||
      !Number.isFinite(calculation.dataCompletenessScore) ||
      calculation.dataCompletenessScore < 0 ||
      calculation.dataCompletenessScore > 100
    ) {
      throw new Error(
        `Validation Error: dataCompletenessScore must be a finite number between 0 and 100. Got: ${calculation.dataCompletenessScore}`
      );
    }
  }

  /**
   * Resolves a building ID or passport ID to the database primary key ID.
   * Throws if the building does not exist.
   */
  public static async resolveBuildingId(idOrPassport: string): Promise<string> {
    if (!idOrPassport || typeof idOrPassport !== "string") {
      throw new Error("Building identifier must be a non-empty string.");
    }
    const res = await query<{ id: string }>(
      "SELECT id FROM buildings WHERE id = $1 OR passport_id = $2 LIMIT 1;",
      [idOrPassport, idOrPassport.toUpperCase()]
    );
    if (res.rows.length === 0) {
      throw new Error(`Referenced building '${idOrPassport}' does not exist.`);
    }
    return res.rows[0].id;
  }

  /**
   * Validates that an assessedBy user ID references a valid existing user.
   */
  public static async validateAssessedBy(userId: string): Promise<void> {
    const res = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1 LIMIT 1;",
      [userId]
    );
    if (res.rows.length === 0) {
      throw new Error(`Referenced user for assessedBy '${userId}' does not exist.`);
    }
  }

  /**
   * Evaluates server-side RBAC and building ownership authorization for health assessment operations.
   */
  public static async checkBuildingHealthAccess(
    idOrPassportId: string,
    user: UserSession
  ): Promise<{
    allowed: boolean;
    status: number;
    message: string;
    buildingId?: string;
  }> {
    const building = await BuildingService.getBuildingById(idOrPassportId);
    if (!building) {
      return {
        allowed: false,
        status: 404,
        message: `Building '${idOrPassportId}' not found.`,
      };
    }

    if (user.role === "admin" || user.role === "engineer") {
      return {
        allowed: true,
        status: 200,
        message: "Authorized.",
        buildingId: building.id,
      };
    }

    if (user.role === "owner") {
      if (building.createdBy && building.createdBy === user.userId) {
        return {
          allowed: true,
          status: 200,
          message: "Authorized.",
          buildingId: building.id,
        };
      }
      return {
        allowed: false,
        status: 403,
        message: "Forbidden. You do not have permission to access health assessments for this building.",
      };
    }

    return {
      allowed: false,
      status: 403,
      message: `Forbidden. Role '${user.role}' is not authorized to access health assessments.`,
    };
  }

  /**
   * Core domain operation: Executes feature extraction, calculates deterministic health assessment,
   * validates invariants, and persists the assessment record to PostgreSQL.
   */
  public static async calculateAndPersistAssessment(
    buildingIdOrPassport: string,
    options?: {
      assessedBy?: string | null;
      referenceDate?: Date;
    }
  ): Promise<HealthAssessmentRecord> {
    // 1. Resolve building existence
    const buildingId = await this.resolveBuildingId(buildingIdOrPassport);

    // 2. Validate assessed_by user if provided
    if (options?.assessedBy) {
      await this.validateAssessedBy(options.assessedBy);
    }

    // 3. Extract civil features from database evidence
    const features = await extractCivilHealthFeatures(buildingId, options?.referenceDate);
    if (!features) {
      throw new Error(`Failed to extract civil health features for building '${buildingId}'.`);
    }

    // 4. Calculate deterministic health assessment using bp-rules-v1.0
    const calculation = calculateHealthAssessment(features);

    // 5. Persist calculation to PostgreSQL
    return this.persistCalculation(calculation, {
      assessedBy: options?.assessedBy || null,
      assessmentDate: options?.referenceDate || new Date(),
    });
  }

  /**
   * Directly persists an existing HealthAssessmentCalculation after domain validation.
   */
  public static async persistCalculation(
    calculation: HealthAssessmentCalculation,
    options?: {
      assessedBy?: string | null;
      assessmentDate?: Date;
    }
  ): Promise<HealthAssessmentRecord> {
    // 1. Invariant validation
    this.validateCalculation(calculation);

    // 2. Foreign key verification
    const buildingId = await this.resolveBuildingId(calculation.buildingId);

    if (options?.assessedBy) {
      await this.validateAssessedBy(options.assessedBy);
    }

    // 3. Unique identifier generation (ha_timestamp_random)
    const id = `ha_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
    const assessmentDate = options?.assessmentDate || new Date();

    const insertSql = `
      INSERT INTO health_assessments (
        id,
        building_id,
        assessment_date,
        overall_score,
        risk_level,
        category_scores,
        contributing_factors,
        recommendations,
        data_completeness_score,
        model_version,
        engine_type,
        summary_explanation,
        assessed_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *;
    `;

    const params = [
      id,
      buildingId,
      assessmentDate,
      calculation.overallScore,
      calculation.riskLevel,
      JSON.stringify(calculation.categoryScores),
      JSON.stringify(calculation.contributingFactors),
      JSON.stringify(calculation.recommendations),
      calculation.dataCompletenessScore,
      calculation.modelVersion,
      calculation.engineType,
      calculation.summaryExplanation,
      options?.assessedBy || null,
    ];

    const res = await query<HealthAssessmentDbRow>(insertSql, params);
    return mapHealthAssessmentRow(res.rows[0]);
  }

  /**
   * Retrieves single assessment by ID.
   */
  public static async getAssessmentById(id: string): Promise<HealthAssessmentRecord | null> {
    if (!id || typeof id !== "string") return null;

    const res = await query<HealthAssessmentDbRow>(
      "SELECT * FROM health_assessments WHERE id = $1 LIMIT 1;",
      [id]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapHealthAssessmentRow(res.rows[0]);
  }

  /**
   * Retrieves all historical assessments for a building, ordered newest first.
   */
  public static async getAssessmentsByBuilding(
    buildingIdOrPassport: string
  ): Promise<HealthAssessmentRecord[]> {
    if (!buildingIdOrPassport || typeof buildingIdOrPassport !== "string") return [];

    const res = await query<HealthAssessmentDbRow>(
      `SELECT h.* FROM health_assessments h
       JOIN buildings b ON h.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY h.assessment_date DESC, h.created_at DESC;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    return res.rows.map(mapHealthAssessmentRow);
  }

  /**
   * Retrieves the most recent assessment for a building.
   */
  public static async getLatestAssessmentByBuilding(
    buildingIdOrPassport: string
  ): Promise<HealthAssessmentRecord | null> {
    if (!buildingIdOrPassport || typeof buildingIdOrPassport !== "string") return null;

    const res = await query<HealthAssessmentDbRow>(
      `SELECT h.* FROM health_assessments h
       JOIN buildings b ON h.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY h.assessment_date DESC, h.created_at DESC
       LIMIT 1;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapHealthAssessmentRow(res.rows[0]);
  }
}
