import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { query, getPostgresPool } from "../src/server/db/postgres";
import { DrawingService } from "../src/server/services/drawing.service";
import { ApprovalService } from "../src/server/services/approval.service";
import { IdentityService } from "../src/server/services/identity.service";
import { AuditService } from "../src/server/services/audit.service";
import { BuildingService } from "../src/server/services/building.service";
import { UserSession } from "../src/lib/types";

describe("Building Passport — Central Record & Blueprint / Approvals / Identity Test Suite", () => {
  let targetBuildingId: string;
  let targetPassportId: string;
  let createdDrawingId: string | null = null;
  let createdApprovalId: string | null = null;
  let createdIdentityId: string | null = null;

  const adminSession: UserSession = {
    userId: "usr_admin_001",
    email: "admin@buildingpassport.org",
    role: "admin",
    name: "System Administrator",
  };

  before(async () => {
    // Confirm connection and retrieve first baseline building
    const buildings = await BuildingService.getBuildings(adminSession);
    assert.ok(buildings.length > 0, "At least one baseline building must exist");
    targetBuildingId = buildings[0].id;
    targetPassportId = buildings[0].passportId;
  });

  after(async () => {
    // Cleanup any test records created during the test run
    if (createdDrawingId) {
      await query("DELETE FROM drawings WHERE id = $1", [createdDrawingId]);
    }
    if (createdApprovalId) {
      await query("DELETE FROM regulatory_approvals WHERE id = $1", [createdApprovalId]);
    }
    if (createdIdentityId) {
      await query("DELETE FROM owner_identity_verifications WHERE id = $1", [createdIdentityId]);
    }
    // Clean up audit logs created for test
    await query("DELETE FROM audit_logs WHERE metadata->>'testRun' = 'true'");
    await getPostgresPool().end();
  });

  it("1. BuildingService retrieves cadastral GIS fields and certifications", async () => {
    const building = await BuildingService.getBuildingById(targetBuildingId, adminSession);
    assert.ok(building, `Building ${targetBuildingId} must exist`);
    assert.strictEqual(building.id, targetBuildingId);
    assert.ok(building.location, "Building location must exist");
    assert.ok("plotNumber" in building, "plotNumber property should be defined on record");
    assert.ok("surveyNumber" in building, "surveyNumber property should be defined on record");
  });

  it("2. DrawingService handles versioning and revision auto-generation", async () => {
    const drawing = await DrawingService.createDrawing(
      targetBuildingId,
      {
        drawingType: "architectural",
        title: "Test Master Architectural Plan",
        storageReference: "/srv/storage/building-passport/drawings/test_blueprint_a101.pdf",
        originalFilename: "test_blueprint_a101.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
        scale: "1:100",
        sheetNumber: "A-101-TEST",
        notes: "Initial master submission for automated testing",
      },
      "usr_admin_001"
    );

    assert.ok(drawing.id, "Drawing ID must be generated");
    assert.strictEqual(drawing.drawingType, "architectural");
    assert.strictEqual(drawing.sheetNumber, "A-101-TEST");
    assert.ok(drawing.version >= 1, "Version number must be at least 1");
    assert.strictEqual(drawing.revisionCode, `R${drawing.version - 1}`);
    assert.strictEqual(drawing.approvalStatus, "SUBMITTED");
    assert.ok(drawing.storageReference, "Storage reference must be set");

    createdDrawingId = drawing.id;
  });

  it("3. DrawingService allows approval status transitions with audit logging", async () => {
    assert.ok(createdDrawingId, "Requires drawing created in step 2");
    const updated = await DrawingService.setApprovalStatus(
      createdDrawingId,
      "APPROVED",
      "usr_admin_001",
      "Verified by municipal civil engineer panel"
    );

    assert.strictEqual(updated.approvalStatus, "APPROVED");
    assert.ok(updated.approvedAt, "approvedAt timestamp must be populated");
    assert.strictEqual(updated.approvedBy, "usr_admin_001");

    // Verify drawing list reflects updated state
    const list = await DrawingService.getDrawings(targetBuildingId);
    const found = list.find((d) => d.id === createdDrawingId);
    assert.ok(found, "Updated drawing must exist in list");
    assert.strictEqual(found.approvalStatus, "APPROVED");
  });

  it("4. RegulatoryApprovalService records statutory NOCs with validity tracking", async () => {
    const approval = await ApprovalService.createApproval(
      targetBuildingId,
      {
        approvalType: "fire_noc",
        issuingAuthority: "State Disaster Management & Fire Authority",
        approvalNumber: "FIRE/NOC/2026/TEST-88",
        issueDate: "2026-01-15",
        validUntil: "2028-01-14",
        status: "ACTIVE",
        remarks: "Annual inspection passed with compliance to NBC 2016 Part 4",
      },
      "usr_admin_001",
      "Principal Showcase Admin"
    );

    assert.ok(approval.id, "Approval ID must be generated");
    assert.strictEqual(approval.approvalType, "fire_noc");
    assert.strictEqual(approval.approvalNumber, "FIRE/NOC/2026/TEST-88");
    assert.strictEqual(approval.status, "ACTIVE");

    createdApprovalId = approval.id;

    // Verify listing
    const list = await ApprovalService.getApprovals(targetBuildingId);
    const found = list.find((a) => a.id === createdApprovalId);
    assert.ok(found, "Created approval must exist in building approvals list");
    assert.strictEqual(found.issuingAuthority, "State Disaster Management & Fire Authority");
  });

  it("5. RegulatoryApprovalService updates status and remarks", async () => {
    assert.ok(createdApprovalId, "Requires approval created in step 4");
    const updated = await ApprovalService.updateApproval(
      createdApprovalId,
      {
        status: "PENDING_RENEWAL",
        remarks: "Scheduled for bi-annual re-certification inspection",
      },
      "usr_admin_001",
      "Executive Engineer"
    );

    assert.strictEqual(updated.status, "PENDING_RENEWAL");
    assert.strictEqual(updated.remarks, "Scheduled for bi-annual re-certification inspection");
  });

  it("6. OwnerIdentityService Sandbox Gateway initiates verification with test OTP hint", async () => {
    const initiation = await IdentityService.initiateVerification(
      {
        buildingId: targetBuildingId,
        ownerUserId: "usr_admin_001",
        ownerName: "Shri Rameshwar Patil",
        verificationMethod: "sandbox_aadhaar_otp",
        maskedId: "XXXX-XXXX-8912",
        consentReference: "CONSENT-DEMO-2026-001",
      },
      "usr_admin_001",
      "Shri Rameshwar Patil"
    );

    assert.ok(initiation.verification.id, "Verification ID must be created");
    assert.strictEqual(initiation.verification.status, "PENDING");
    assert.strictEqual(initiation.verification.documentMaskedId, "XXXX-XXXX-8912");
    assert.strictEqual(initiation.sandbox.isSandbox, true);
    assert.strictEqual(initiation.sandbox.testOtpHint, "898312");

    createdIdentityId = initiation.verification.id;
  });

  it("7. OwnerIdentityService rejects incorrect OTP in Sandbox", async () => {
    assert.ok(createdIdentityId, "Requires identity initiated in step 6");
    const failed = await IdentityService.confirmVerification(
      createdIdentityId!,
      "000000",
      "usr_admin_001",
      "Shri Rameshwar Patil"
    );
    assert.strictEqual(failed.status, "FAILED");
  });

  it("8. OwnerIdentityService confirms verification with canonical test OTP 898312", async () => {
    assert.ok(createdIdentityId, "Requires identity initiated in step 6");
    const verified = await IdentityService.confirmVerification(
      createdIdentityId!,
      "898312",
      "usr_admin_001",
      "Shri Rameshwar Patil"
    );

    assert.strictEqual(verified.status, "VERIFIED");
    assert.ok(verified.verifiedAt, "verifiedAt timestamp must be recorded");
    assert.strictEqual(verified.verificationMethod, "sandbox_aadhaar_otp");
  });

  it("9. AuditService creates immutable audit records and returns chronological trail", async () => {
    await AuditService.logAction({
      actorId: "usr_admin_001",
      actorName: "Principal Showcase Administrator",
      actorRole: "admin",
      action: "CIVIL_AUDIT_VERIFIED",
      entity: "building",
      entityId: targetBuildingId,
      metadata: { testRun: "true", verifiedItems: 172 },
    });

    const logs = await AuditService.getLogsForEntity("building", targetBuildingId, 20);
    assert.ok(logs.length > 0, "Audit logs should not be empty");
    const testLog = logs.find((l) => l.action === "CIVIL_AUDIT_VERIFIED");
    assert.ok(testLog, "Test audit log must be found");
    assert.strictEqual(testLog.actorRole, "admin");
    assert.strictEqual((testLog.metadata as Record<string, unknown>)?.testRun, "true");
  });

  it("10. Public Building Passport enforces strict privacy redaction", async () => {
    const publicData = await BuildingService.getPublicPassport(targetPassportId);
    assert.ok(publicData, "Public passport must resolve");
    // Verify required public fields are present
    assert.strictEqual(publicData.id, targetBuildingId);
    assert.ok(publicData.name, "Public name must exist");
    assert.ok(publicData.passportId, "Passport ID must exist");
    // Verify private contacts and documents are NOT present
    assert.strictEqual((publicData as Record<string, unknown>).ownerEmail, undefined);
    assert.strictEqual((publicData as Record<string, unknown>).ownerPhone, undefined);
    assert.strictEqual((publicData as Record<string, unknown>).complianceScore, undefined);
    assert.strictEqual((publicData as Record<string, unknown>).drawings, undefined);
    assert.strictEqual((publicData as Record<string, unknown>).documents, undefined);
  });
});
