import { UserSession } from "@/lib/types";
import { BuildingService } from "./building.service";
import { InspectionService } from "./inspection.service";
import { DefectService } from "./defect.service";
import { MaintenanceService } from "./maintenance.service";
import { DocumentService } from "./document.service";
import {
  evaluateBuildingRules,
  BuildingComplianceEvaluation,
  BuildingRuleInput,
} from "@/lib/construction-rules";

export class ComplianceService {
  /**
   * Evaluates server-side RBAC and building ownership authorization for Construction Rules operations.
   * - Admin and Engineer: Authorized across all records.
   * - Owner: Authorized ONLY for buildings they own / created.
   * - Public: Forbidden.
   */
  public static async checkBuildingComplianceAccess(
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
      const isOwner =
        (building.createdBy && building.createdBy === user.userId) ||
        (building.owner?.email &&
          building.owner.email.toLowerCase() === user.email.toLowerCase());

      if (isOwner) {
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
        message: "Forbidden. You do not have permission to access compliance assessments for this building.",
      };
    }

    return {
      allowed: false,
      status: 403,
      message: `Forbidden. Role '${user.role}' is not authorized to access construction compliance evaluations.`,
    };
  }

  /**
   * Deterministically evaluates construction rules and compliance status for a building.
   * Retrieves civil entity records from PostgreSQL and evaluates using the pure rule engine.
   * Never mutates building records, defects, inspections, or maintenance records.
   */
  public static async evaluateBuildingCompliance(
    buildingIdOrPassport: string,
    options?: { referenceDate?: Date }
  ): Promise<BuildingComplianceEvaluation> {
    const building = await BuildingService.getBuildingById(buildingIdOrPassport);
    if (!building) {
      throw new Error(`Building '${buildingIdOrPassport}' does not exist.`);
    }

    const [inspections, defects, maintenance, documents, photographs] = await Promise.all([
      InspectionService.getInspections(building.id),
      DefectService.getDefects(building.id),
      MaintenanceService.getMaintenance(building.id),
      DocumentService.getDocuments(building.id, "admin"),
      BuildingService.getPhotographs(building.id, "admin"),
    ]);

    const input: BuildingRuleInput = {
      building,
      inspections: inspections || [],
      defects: defects || [],
      maintenance: maintenance || [],
      documents: documents || [],
      photographs: photographs || [],
      referenceDate: options?.referenceDate,
    };

    return evaluateBuildingRules(input);
  }
}
