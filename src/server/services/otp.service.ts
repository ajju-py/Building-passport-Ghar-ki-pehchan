import crypto from "crypto";
import { OtpPurpose } from "@/lib/types";
import { query } from "../db/postgres";
import { EmailService } from "./notification/email.service";

interface OtpDbRow {
  id: string;
  user_id: string;
  purpose: OtpPurpose;
  destination: string;
  otp_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  attempt_count: number;
  max_attempts: number;
  created_at: Date;
}

export class OtpService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RESEND_COOLDOWN_SECONDS = 30;

  /**
   * Generates a cryptographically secure 6-digit numerical OTP.
   */
  public static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Computes SHA-256 hash of plaintext OTP.
   */
  public static hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp.trim()).digest("hex");
  }

  /**
   * Generates, hashes, persists, and dispatches an OTP via the configured email delivery provider.
   */
  public static async createAndSendOtp(params: {
    userId: string;
    destination: string;
    purpose: OtpPurpose;
  }): Promise<{ success: boolean; message: string; destination: string; expiresAt: string }> {
    const destNorm = params.destination.trim().toLowerCase();

    // 1. Enforce resend cooldown (rate limit)
    const recentOtpRes = await query<{ created_at: Date }>(
      `SELECT created_at FROM otp_verifications 
       WHERE (user_id = $1 OR LOWER(destination) = $2) 
         AND purpose = $3 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [params.userId, destNorm, params.purpose]
    );

    if (recentOtpRes.rows.length > 0) {
      const lastCreated = new Date(recentOtpRes.rows[0].created_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastCreated) / 1000);
      if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
        const waitTime = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        throw new Error(`Please wait ${waitTime} second(s) before requesting another verification code.`);
      }
    }

    // 2. Invalidate previous active OTPs for this user & purpose
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE (user_id = $1 OR LOWER(destination) = $2) 
         AND purpose = $3 
         AND consumed_at IS NULL;`,
      [params.userId, destNorm, params.purpose]
    );

    // 3. Generate cryptographic OTP and secure hash
    const plaintextOtp = this.generateSecureOtp();
    const otpHash = this.hashOtp(plaintextOtp);

    const otpId = `otp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Persist to PostgreSQL (only hash is stored, never plaintext)
    await query(
      `INSERT INTO otp_verifications (
        id, user_id, purpose, destination, otp_hash, expires_at, attempt_count, max_attempts, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW());`,
      [otpId, params.userId, params.purpose, destNorm, otpHash, expiresAt, this.MAX_ATTEMPTS]
    );

    // 5. Dispatch via Email Service
    await EmailService.sendOtpEmail({
      to: destNorm,
      otp: plaintextOtp,
      purpose: params.purpose,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
    });

    return {
      success: true,
      message: "Verification code dispatched successfully.",
      destination: this.maskDestination(destNorm),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Masks email or phone for anti-enumeration responses (e.g. j***@domain.com).
   */
  public static maskDestination(destination: string): string {
    if (destination.includes("@")) {
      const [local, domain] = destination.split("@");
      const visible = local.length > 2 ? local.slice(0, 2) + "***" : local + "***";
      return `${visible}@${domain}`;
    }
    return destination.length > 4 ? destination.slice(0, 2) + "****" + destination.slice(-2) : "****";
  }

  /**
   * Validates submitted OTP using timing-safe comparison, purpose isolation, expiration, and attempt limits.
   */
  public static async verifyOtp(params: {
    destinationOrUserId: string;
    otp: string;
    purpose: OtpPurpose;
  }): Promise<{ success: boolean; message: string; userId?: string }> {
    const targetNorm = params.destinationOrUserId.trim().toLowerCase();

    // Find the latest record matching either userId or destination AND purpose
    const res = await query<OtpDbRow>(
      `SELECT * FROM otp_verifications 
       WHERE (user_id = $1 OR LOWER(destination) = $2) 
         AND purpose = $3 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [params.destinationOrUserId, targetNorm, params.purpose]
    );

    if (res.rows.length === 0) {
      return {
        success: false,
        message: "No verification code found. Please request a new code.",
      };
    }

    const record = res.rows[0];

    // Check if already consumed/invalidated
    if (record.consumed_at) {
      return {
        success: false,
        message: "This verification code has already been used or invalidated. Please request a new code.",
      };
    }

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        message: "Verification code has expired. Please request a new code.",
      };
    }

    // Check if maximum attempts exceeded
    if (record.attempt_count >= record.max_attempts) {
      await query("UPDATE otp_verifications SET consumed_at = NOW() WHERE id = $1;", [record.id]);
      return {
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new code.",
      };
    }

    // Timing-safe comparison of SHA-256 hashes
    const candidateHash = this.hashOtp(params.otp);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(record.otp_hash, "hex");

    let isMatch = false;
    if (candidateBuffer.length === storedBuffer.length) {
      isMatch = crypto.timingSafeEqual(candidateBuffer, storedBuffer);
    }

    if (!isMatch) {
      const newAttempts = record.attempt_count + 1;
      let consumeClause = "";
      if (newAttempts >= record.max_attempts) {
        consumeClause = ", consumed_at = NOW()";
      }

      await query(
        `UPDATE otp_verifications 
         SET attempt_count = $1 ${consumeClause} 
         WHERE id = $2;`,
        [newAttempts, record.id]
      );

      const remaining = Math.max(0, record.max_attempts - newAttempts);
      return {
        success: false,
        message:
          remaining > 0
            ? `Invalid verification code. ${remaining} attempt(s) remaining.`
            : "Maximum verification attempts exceeded. Please request a new code.",
      };
    }

    // Successful verification: consume OTP immediately (single-use replay prevention)
    await query("UPDATE otp_verifications SET consumed_at = NOW() WHERE id = $1;", [record.id]);

    return {
      success: true,
      message: "Verification successful.",
      userId: record.user_id,
    };
  }
}
