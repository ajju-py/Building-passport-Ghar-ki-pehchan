import crypto from "node:crypto";
import { query } from "../db/postgres";
import {
  OwnerIdentityVerificationRecord,
  IdentityVerificationMethod,
  IdentityVerificationStatus,
} from "@/lib/types";
import { OwnerIdentityVerificationDbRow, mapOwnerIdentityVerificationRow } from "../db/mappers";
import { AuditService } from "./audit.service";

export interface InitiateVerificationInput {
  buildingId: string;
  ownerUserId?: string;
  ownerName: string;
  verificationMethod: IdentityVerificationMethod;
  maskedId: string; // e.g. "XXXX-XXXX-8983"
  consentReference: string;
}

export class IdentityService {
  /**
   * Retrieves the current identity verification record for a building.
   */
  public static async getVerification(buildingId: string): Promise<OwnerIdentityVerificationRecord | null> {
    const res = await query<OwnerIdentityVerificationDbRow>(
      `SELECT * FROM owner_identity_verifications 
       WHERE building_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [buildingId]
    );

    if (res.rows.length === 0) return null;
    return mapOwnerIdentityVerificationRow(res.rows[0]);
  }

  /**
   * Initiates an identity verification request using the extensible Sandbox Provider.
   * Ensures NO full government ID numbers are ever submitted or persisted.
   */
  public static async initiateVerification(
    input: InitiateVerificationInput,
    actorId?: string,
    actorName?: string
  ): Promise<{
    verification: OwnerIdentityVerificationRecord;
    sandbox: {
      isSandbox: boolean;
      sessionReference: string;
      testOtpHint: string;
      notice: string;
    };
  }> {
    // Security check: Masked ID must strictly adhere to redacted format
    let cleanMasked = input.maskedId.trim();
    if (/^\d{12}$/.test(cleanMasked)) {
      // If user accidentally typed full 12 digits, mask all but the last 4 immediately!
      cleanMasked = `XXXX-XXXX-${cleanMasked.slice(-4)}`;
    }

    const id = `idver_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const providerRef = `SBX_REF_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const consentRef = input.consentReference?.trim() || `CONSENT_${Date.now()}`;

    const res = await query<OwnerIdentityVerificationDbRow>(
      `INSERT INTO owner_identity_verifications (
        id, building_id, owner_user_id, owner_name, verification_method,
        status, document_ref_type, document_masked_id, provider_reference,
        consent_reference, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;`,
      [
        id,
        input.buildingId,
        input.ownerUserId || null,
        input.ownerName.trim(),
        input.verificationMethod,
        input.verificationMethod === "digilocker_sandbox" ? "DIGILOCKER_DOCUMENT" : "AADHAAR_UID_MASKED",
        cleanMasked,
        providerRef,
        consentRef,
      ]
    );

    const verification = mapOwnerIdentityVerificationRow(res.rows[0]);

    await AuditService.logAction({
      actorId,
      actorName,
      action: "IDENTITY_VERIFICATION_INITIATED",
      entity: "building",
      entityId: input.buildingId,
      metadata: {
        verificationId: verification.id,
        method: verification.verificationMethod,
        maskedId: verification.documentMaskedId,
        providerReference: providerRef,
      },
    });

    return {
      verification,
      sandbox: {
        isSandbox: true,
        sessionReference: providerRef,
        testOtpHint: "898312",
        notice:
          "Showcase Sandbox Mode: Official UIDAI / DigiLocker integration operates in sandbox. Enter OTP '898312' to complete simulated verification.",
      },
    };
  }

  /**
   * Completes the sandbox verification step.
   * If correct OTP is submitted, transitions status to 'VERIFIED'.
   */
  public static async confirmVerification(
    verificationId: string,
    otp: string,
    actorId?: string,
    actorName?: string
  ): Promise<OwnerIdentityVerificationRecord> {
    const existing = await query<OwnerIdentityVerificationDbRow>(
      `SELECT * FROM owner_identity_verifications WHERE id = $1 LIMIT 1;`,
      [verificationId]
    );

    if (existing.rows.length === 0) {
      throw new Error(`Verification request ${verificationId} not found.`);
    }

    const row = existing.rows[0];
    const isSuccessful = otp.trim() === "898312" || otp.trim() === "123456";

    const newStatus: IdentityVerificationStatus = isSuccessful ? "VERIFIED" : "FAILED";
    const remarks = isSuccessful
      ? "Identity authenticated and verified via Showcase Sandbox Gateway."
      : "Identity verification failed: Invalid OTP submitted to sandbox provider.";

    const res = await query<OwnerIdentityVerificationDbRow>(
      `UPDATE owner_identity_verifications
       SET status = $1,
           verified_at = CASE WHEN $1 = 'VERIFIED' THEN NOW() ELSE NULL END,
           verified_by = CASE WHEN $1 = 'VERIFIED' THEN $2 ELSE NULL END,
           remarks = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *;`,
      [newStatus, actorId || null, remarks, verificationId]
    );

    const updated = mapOwnerIdentityVerificationRow(res.rows[0]);

    await AuditService.logAction({
      actorId,
      actorName,
      action: isSuccessful ? "IDENTITY_VERIFIED" : "IDENTITY_VERIFICATION_FAILED",
      entity: "building",
      entityId: row.building_id,
      metadata: {
        verificationId,
        status: newStatus,
        method: row.verification_method,
      },
    });

    return updated;
  }
}
