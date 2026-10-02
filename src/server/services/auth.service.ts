import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AccountStatus, UserRole, UserSession } from "@/lib/types";
import { env } from "../config/env";
import { query } from "../db/postgres";
import { initialSeedUsers } from "../data/seedData";
import { OtpService } from "./otp.service";

export interface AuthTokens {
  token: string;
  user: UserSession;
}

interface FullUserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mobile: string | null;
  account_status: AccountStatus;
  email_verified: boolean;
  email_verified_at: Date | null;
  mobile_verified_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  password_changed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class AuthService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  /**
   * Ensures default seed users exist in PostgreSQL if empty.
   */
  public static async ensureSeedUsers(): Promise<void> {
    try {
      const res = await query<{ count: number }>("SELECT count(*)::int as count FROM users;");
      if (res.rows[0].count === 0) {
        for (const u of initialSeedUsers) {
          const passwordHash = u.rawPasswordForDemo
            ? await bcrypt.hash(u.rawPasswordForDemo, 10)
            : u.passwordHash;
          await query(
            `INSERT INTO users (id, name, email, password, role, account_status, email_verified_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW(), NOW())
             ON CONFLICT (id) DO NOTHING;`,
            [u.id, u.name, u.email.toLowerCase().trim(), passwordHash, u.role]
          );
        }
        console.log("[AuthService] Seeded default users into PostgreSQL.");
      }
    } catch (err: unknown) {
      console.error("[AuthService] Error checking/seeding users in PostgreSQL:", (err as Error).message);
    }
  }

  /**
   * Generates a signed JWT for an authenticated user session.
   */
  public static signToken(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    accountStatus?: AccountStatus;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.accountStatus || "active",
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Verifies and extracts session from a JWT string.
   */
  public static verifyToken(token: string): UserSession | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        name: string;
        role: UserRole;
        status?: AccountStatus;
      };
      return {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        accountStatus: decoded.status || "active",
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalizes an email address.
   */
  public static normalizeEmail(email: string): string {
    if (!email || typeof email !== "string") {
      throw new Error("Invalid email format.");
    }
    return email.toLowerCase().trim();
  }

  /**
   * Validates email format and returns normalized email.
   */
  public static validateEmail(email: string): string {
    if (!email || typeof email !== "string") {
      throw new Error("Invalid email format.");
    }
    const trimmed = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error("Invalid email format.");
    }
    return trimmed.toLowerCase();
  }

  /**
   * Validates password complexity.
   */
  public static validatePasswordPolicy(password: string): void {
    if (!password || typeof password !== "string") {
      throw new Error("Password is required.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters in length.");
    }
    if (password.length > 128) {
      throw new Error("Password cannot exceed 128 characters.");
    }
  }

  /**
   * Registers a new user account in PostgreSQL.
   * Public registration permits ONLY 'owner' or 'public' roles.
   * Role escalation to 'admin' or 'engineer' is strictly prohibited.
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    mobile?: string;
  }): Promise<{ user: UserSession; token: string; verificationSent: boolean; message: string }> {
    const emailNorm = this.validateEmail(data.email);
    this.validatePasswordPolicy(data.password);

    // Strict role escalation defense
    if (data.role === "admin" || data.role === "engineer") {
      throw new Error(
        "Self-registration as 'admin' or 'engineer' is prohibited. Privileged accounts require municipal administrator invitation."
      );
    }

    const assignedRole: UserRole = data.role === "public" ? "public" : "owner";

    // Duplicate email check & Case A / Case B handling
    const existing = await query<{
      id: string;
      account_status: AccountStatus;
      email_verified: boolean;
      email_verified_at: Date | null;
    }>(
      "SELECT id, account_status, email_verified, email_verified_at FROM users WHERE email = $1 LIMIT 1;",
      [emailNorm]
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const mobileNorm = data.mobile ? data.mobile.trim() : null;
    const initialStatus: AccountStatus = "pending_verification";

    let userId: string;
    let isExistingUnverified = false;

    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      const isVerified = u.account_status === "active" || u.email_verified === true || u.email_verified_at !== null;
      if (isVerified) {
        // CASE A: Account is already verified
        throw new Error("An account with this email address already exists.");
      }

      // CASE B: Account exists but email is NOT verified
      // Safely restart verification: update credentials, refresh unverified status
      userId = u.id;
      isExistingUnverified = true;
      await query(
        `UPDATE users 
         SET name = $1, password = $2, role = $3, mobile = $4, account_status = $5, email_verified = false, email_verified_at = NULL, updated_at = NOW() 
         WHERE id = $6;`,
        [data.name.trim(), passwordHash, assignedRole, mobileNorm, initialStatus, userId]
      );
    } else {
      // New account creation
      userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO users 
         (id, name, email, password, role, mobile, account_status, email_verified, failed_login_attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, 0, NOW(), NOW());`,
        [userId, data.name.trim(), emailNorm, passwordHash, assignedRole, mobileNorm, initialStatus]
      );
    }

    // Dispatch verification token and 6-digit OTP (10 min expiry)
    let verificationSent = false;
    try {
      await OtpService.createAndSendVerificationToken({
        userId,
        userName: data.name.trim(),
        destination: emailNorm,
        expiryMinutes: 10,
      });
      verificationSent = true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to dispatch verification email.";
      // If this was a new account, clean it up to prevent orphaned records with failing email config
      if (!isExistingUnverified) {
        try {
          await query("DELETE FROM users WHERE id = $1;", [userId]);
        } catch (cleanupErr) {
          console.error("[AuthService] Error rolling back failed registration:", cleanupErr);
        }
      }
      console.error("[AuthService] Verification email delivery failed:", errMsg);
      throw new Error(`Unable to deliver verification email. ${errMsg}`);
    }

    const sessionUser: UserSession = {
      userId,
      name: data.name.trim(),
      email: emailNorm,
      role: assignedRole,
      accountStatus: initialStatus,
    };

    const token = this.signToken({
      id: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
      accountStatus: sessionUser.accountStatus,
    });

    return {
      user: sessionUser,
      token,
      verificationSent,
      message: "Account registered successfully. Check your email for your 6-digit verification code.",
    };
  }

  /**
   * Authenticates user credentials with brute-force protection, account status checks, and lockout.
   */
  public static async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const emailNorm = this.normalizeEmail(credentials.email);

    const res = await query<FullUserRow>(
      `SELECT id, name, email, password, role, account_status, email_verified, failed_login_attempts, locked_until
       FROM users WHERE email = $1 LIMIT 1;`,
      [emailNorm]
    );

    if (res.rows.length === 0) {
      // Mitigate timing attack with dummy hash comparison
      await bcrypt.compare(
        credentials.password,
        "$2a$10$wT5i/bJq9Z.g12r06aZ98e1m5ZkPvhX41eYV1rQ1H2GkZJq9K7V6m"
      );
      throw new Error("Invalid email or password.");
    }

    const user = res.rows[0];

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      const waitMinutes = Math.max(
        1,
        Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (60 * 1000))
      );
      throw new Error(
        `Account is temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minute(s) or reset your password.`
      );
    }

    // Check password match
    const match = await bcrypt.compare(credentials.password, user.password);

    if (!match) {
      const newFailed = (user.failed_login_attempts || 0) + 1;
      let lockoutSql = "";
      const params: unknown[] = [newFailed, user.id];

      if (newFailed >= this.MAX_FAILED_ATTEMPTS) {
        lockoutSql = `, locked_until = NOW() + INTERVAL '${this.LOCKOUT_DURATION_MINUTES} minutes'`;
      }

      await query(
        `UPDATE users SET failed_login_attempts = $1 ${lockoutSql}, updated_at = NOW() WHERE id = $2;`,
        params
      );

      throw new Error("Invalid email or password.");
    }

    // Check account status
    if (user.account_status === "disabled") {
      throw new Error("This account has been disabled. Please contact municipal administration.");
    }

    if (user.account_status === "suspended") {
      throw new Error("This account is currently suspended. Administrative review is required.");
    }

    if (user.account_status === "pending_verification" || user.email_verified === false) {
      throw new Error("Please verify your email address before signing in.");
    }

    // Successful login: reset failed attempts and record last login
    await query(
      `UPDATE users 
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() 
       WHERE id = $1;`,
      [user.id]
    );

    const sessionUser: UserSession = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.account_status,
    };

    const token = this.signToken({
      id: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
      accountStatus: sessionUser.accountStatus,
    });

    return { token, user: sessionUser };
  }

  /**
   * Enumeration-safe forgot password request.
   * Generates a PASSWORD_RESET OTP and dispatches it if the account exists and is not disabled.
   */
  public static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const emailNorm = this.normalizeEmail(email);

    const res = await query<FullUserRow>(
      "SELECT id, email, account_status FROM users WHERE email = $1 LIMIT 1;",
      [emailNorm]
    );

    if (res.rows.length > 0) {
      const user = res.rows[0];
      if (user.account_status !== "disabled") {
        try {
          await OtpService.createAndSendOtp({
            userId: user.id,
            destination: user.email,
            purpose: "PASSWORD_RESET",
          });
        } catch (err: unknown) {
          console.warn("[AuthService] Could not dispatch reset OTP:", (err as Error).message);
        }
      }
    }

    // Always return generic enumeration-safe response
    return {
      success: true,
      message: "If an account matches that email address, password reset instructions have been dispatched.",
    };
  }

  /**
   * Resets password using a validated PASSWORD_RESET OTP.
   */
  public static async resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const emailNorm = this.normalizeEmail(data.email);
    this.validatePasswordPolicy(data.newPassword);

    const userRes = await query<FullUserRow>(
      "SELECT id, email, account_status FROM users WHERE email = $1 LIMIT 1;",
      [emailNorm]
    );

    if (userRes.rows.length === 0) {
      throw new Error("Invalid or expired password reset request.");
    }

    const user = userRes.rows[0];
    if (user.account_status === "disabled") {
      throw new Error("This account is disabled. Password reset cannot be completed.");
    }

    // Verify OTP
    const verifyResult = await OtpService.verifyOtp({
      destinationOrUserId: emailNorm,
      otp: data.otp,
      purpose: "PASSWORD_RESET",
    });

    if (!verifyResult.success) {
      throw new Error(verifyResult.message || "Verification failed.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    // Update password, record password_changed_at, clear lockouts, activate account if pending
    await query(
      `UPDATE users 
       SET password = $1, 
           password_changed_at = NOW(), 
           failed_login_attempts = 0, 
           locked_until = NULL,
           account_status = CASE WHEN account_status = 'pending_verification' THEN 'active' ELSE account_status END,
           email_verified_at = COALESCE(email_verified_at, NOW()),
           updated_at = NOW()
       WHERE id = $2;`,
      [passwordHash, user.id]
    );

    return {
      success: true,
      message: "Password has been reset successfully. Please log in with your new credentials.",
    };
  }

  /**
   * Authenticated password change with verification of current password.
   */
  public static async changePassword(
    userId: string,
    passwords: { currentPassword: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> {
    this.validatePasswordPolicy(passwords.newPassword);

    const res = await query<{ password: string }>(
      "SELECT password FROM users WHERE id = $1 LIMIT 1;",
      [userId]
    );

    if (res.rows.length === 0) {
      throw new Error("User account not found.");
    }

    const match = await bcrypt.compare(passwords.currentPassword, res.rows[0].password);
    if (!match) {
      throw new Error("Current password is incorrect.");
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(passwords.newPassword, salt);

    await query(
      `UPDATE users 
       SET password = $1, password_changed_at = NOW(), updated_at = NOW() 
       WHERE id = $2;`,
      [newHash, userId]
    );

    return {
      success: true,
      message: "Password changed successfully.",
    };
  }

  /**
   * Verifies email or mobile using OTP and activates account.
   */
  public static async verifyOtp(params: {
    destinationOrUserId: string;
    otp: string;
    purpose: "EMAIL_VERIFICATION" | "MOBILE_VERIFICATION";
  }): Promise<{ success: boolean; message: string }> {
    const result = await OtpService.verifyOtp({
      destinationOrUserId: params.destinationOrUserId,
      otp: params.otp,
      purpose: params.purpose,
    });

    if (!result.success || !result.userId) {
      throw new Error(result.message || "Verification failed.");
    }

    if (params.purpose === "EMAIL_VERIFICATION") {
      const userRes = await query<{ account_status: AccountStatus }>(
        "SELECT account_status FROM users WHERE id = $1;",
        [result.userId]
      );
      if (userRes.rows.length > 0) {
        const currentStatus = userRes.rows[0].account_status;
        if (currentStatus === "suspended" || currentStatus === "disabled") {
          // Record verification timestamp but strictly do not bypass suspension/disabled state
          await query(
            `UPDATE users 
             SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW() 
             WHERE id = $1;`,
            [result.userId]
          );
        } else {
          await query(
            `UPDATE users 
             SET account_status = 'active', email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW() 
             WHERE id = $1;`,
            [result.userId]
          );
        }
      }
    } else if (params.purpose === "MOBILE_VERIFICATION") {
      await query(
        `UPDATE users 
         SET mobile_verified_at = NOW(), updated_at = NOW() 
         WHERE id = $1;`,
        [result.userId]
      );
    }

    return {
      success: true,
      message: "Verification successful. Account status updated to active.",
    };
  }

  /**
   * Finds user by ID in PostgreSQL.
   */
  public static async findById(id: string): Promise<UserSession | null> {
    const res = await query<{ id: string; name: string; email: string; role: UserRole; account_status: AccountStatus }>(
      "SELECT id, name, email, role, account_status FROM users WHERE id = $1 LIMIT 1;",
      [id]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const user = res.rows[0];
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.account_status,
    };
  }

  /**
   * Finds user by email in PostgreSQL.
   */
  public static async findByEmail(email: string): Promise<UserSession | null> {
    const res = await query<{ id: string; name: string; email: string; role: UserRole; account_status: AccountStatus }>(
      "SELECT id, name, email, role, account_status FROM users WHERE LOWER(email) = $1 LIMIT 1;",
      [email.toLowerCase().trim()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const user = res.rows[0];
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.account_status,
    };
  }

  /**
   * Resends verification email to an unverified user.
   * Enumeration-safe: always returns a generic response so attackers cannot probe for registered emails.
   */
  public static async resendVerification(
    email: string,
    baseUrl?: string
  ): Promise<{ success: boolean; message: string }> {
    const emailNorm = this.normalizeEmail(email);

    const res = await query<FullUserRow>(
      "SELECT id, name, email, account_status, email_verified, email_verified_at FROM users WHERE email = $1 LIMIT 1;",
      [emailNorm]
    );

    if (res.rows.length > 0) {
      const user = res.rows[0];
      if (user.account_status === "pending_verification" || !user.email_verified_at || user.email_verified === false) {
        await OtpService.createAndSendVerificationToken({
          userId: user.id,
          userName: user.name,
          destination: user.email,
          baseUrl,
          expiryMinutes: 10,
        });
      }
    }

    return {
      success: true,
      message: "If an account matches that email address, a verification link has been dispatched.",
    };
  }

  /**
   * Verifies an account using a cryptographic verification link token.
   */
  public static async verifyEmailToken(token: string): Promise<{
    success: boolean;
    message: string;
    reason?: "MISSING_TOKEN" | "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED";
    userId?: string;
  }> {
    return OtpService.verifyEmailToken(token);
  }
}
