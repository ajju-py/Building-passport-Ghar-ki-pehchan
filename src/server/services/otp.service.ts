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
    if (!otp || typeof otp !== "string") return "";
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
         AND id NOT LIKE 'tok_%'
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
    // Also invalidate any associated tokens for this user and purpose
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE id = $1 OR (user_id = $2 AND purpose = $3 AND consumed_at IS NULL);`,
      [record.id, record.user_id, params.purpose]
    );

    // If EMAIL_VERIFICATION, also update email_verified in users table
    if (params.purpose === "EMAIL_VERIFICATION") {
      await query(
        `UPDATE users 
         SET email_verified = TRUE,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             account_status = CASE WHEN account_status = 'pending_verification' THEN 'active' ELSE account_status END,
             updated_at = NOW() 
         WHERE id = $1;`,
        [record.user_id]
      );
    }

    return {
      success: true,
      message: "Verification successful.",
      userId: record.user_id,
    };
  }

  /**
   * Generates a cryptographically secure random token (hex-encoded).
   * Default 32 bytes = 64 hex characters.
   */
  public static generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
  }

  /**
   * Generates a cryptographically secure token, persists its SHA-256 hash with expiration,
   * and dispatches a verification email via EmailService (Resend).
   */
  public static async createAndSendVerificationToken(params: {
    userId: string;
    destination: string;
    baseUrl?: string;
    expiryMinutes?: number;
  }): Promise<{
    success: boolean;
    message: string;
    destination: string;
    expiresAt: string;
    token: string;
  }> {
    const destNorm = params.destination.trim().toLowerCase();
    const expiryMinutes = params.expiryMinutes || 60;

    // 1. Enforce resend cooldown (rate limit)
    const recentOtpRes = await query<{ created_at: Date }>(
      `SELECT created_at FROM otp_verifications 
       WHERE (user_id = $1 OR LOWER(destination) = $2) 
         AND purpose = 'EMAIL_VERIFICATION' 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [params.userId, destNorm]
    );

    if (recentOtpRes.rows.length > 0) {
      const lastCreated = new Date(recentOtpRes.rows[0].created_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastCreated) / 1000);
      if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
        const waitTime = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        throw new Error(`Please wait ${waitTime} second(s) before requesting another verification email.`);
      }
    }

    // 2. Invalidate previous active verification tokens for this user
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE (user_id = $1 OR LOWER(destination) = $2) 
         AND purpose = 'EMAIL_VERIFICATION' 
         AND consumed_at IS NULL;`,
      [params.userId, destNorm]
    );

    // 3. Generate cryptographic 64-char token & 6-digit OTP
    const rawToken = this.generateSecureToken(32);
    const tokenHash = this.hashOtp(rawToken);
    const plaintextOtp = this.generateSecureOtp();
    const otpHash = this.hashOtp(plaintextOtp);

    const tokenId = `tok_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const otpId = `otp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // 4. Persist to PostgreSQL (only SHA-256 hashes are stored, never plaintext tokens)
    await query(
      `INSERT INTO otp_verifications (
        id, user_id, purpose, destination, otp_hash, expires_at, attempt_count, max_attempts, created_at
      ) VALUES ($1, $2, 'EMAIL_VERIFICATION', $3, $4, $5, 0, 1, NOW()),
               ($6, $2, 'EMAIL_VERIFICATION', $3, $7, $5, 0, $8, NOW());`,
      [tokenId, params.userId, destNorm, tokenHash, expiresAt, otpId, otpHash, this.MAX_ATTEMPTS]
    );

    // 5. Dispatch via Email Service (Resend)
    await EmailService.sendVerificationEmail({
      to: destNorm,
      token: rawToken,
      otp: plaintextOtp,
      expiryMinutes,
      baseUrl: params.baseUrl,
    });

    return {
      success: true,
      message: "Verification email dispatched successfully.",
      destination: this.maskDestination(destNorm),
      expiresAt: expiresAt.toISOString(),
      token: rawToken,
    };
  }

  /**
   * Verifies an email verification link token, validates expiration & single-use,
   * consumes the token, and activates the user account in PostgreSQL.
   */
  public static async verifyEmailToken(token: string): Promise<{
    success: boolean;
    message: string;
    reason?: "MISSING_TOKEN" | "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED";
    userId?: string;
  }> {
    if (!token || typeof token !== "string" || !token.trim()) {
      return {
        success: false,
        reason: "MISSING_TOKEN",
        message: "Verification token is required.",
      };
    }

    const trimmedToken = token.trim();
    const tokenHash = this.hashOtp(trimmedToken);

    // Look up by token hash and purpose
    const res = await query<OtpDbRow>(
      `SELECT * FROM otp_verifications 
       WHERE otp_hash = $1 AND purpose = 'EMAIL_VERIFICATION' 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [tokenHash]
    );

    if (res.rows.length === 0) {
      return {
        success: false,
        reason: "INVALID_TOKEN",
        message: "Invalid verification link or token. Please check the URL or request a new verification email.",
      };
    }

    const record = res.rows[0];

    // Single-use check: already consumed
    if (record.consumed_at) {
      return {
        success: false,
        reason: "ALREADY_USED",
        message: "This verification token has already been used. Please log in or request a new link.",
      };
    }

    // Expiration check
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        reason: "EXPIRED",
        message: "This verification token has expired. Please request a new verification email.",
      };
    }

    // Invalidate / consume all pending EMAIL_VERIFICATION tokens for this user
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE user_id = $1 AND purpose = 'EMAIL_VERIFICATION' AND consumed_at IS NULL;`,
      [record.user_id]
    );

    // Mark user as verified in PostgreSQL
    await query(
      `UPDATE users 
       SET email_verified = TRUE,
           email_verified_at = COALESCE(email_verified_at, NOW()),
           account_status = CASE WHEN account_status = 'pending_verification' THEN 'active' ELSE account_status END,
           updated_at = NOW() 
       WHERE id = $1;`,
      [record.user_id]
    );

    return {
      success: true,
      message: "Email address verified successfully. Your account is now active.",
      userId: record.user_id,
    };
  }
}
