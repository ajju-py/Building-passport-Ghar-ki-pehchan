import bcrypt from "bcryptjs";
import { AccountStatus, UserProfile, UserRole } from "@/lib/types";
import { query } from "../db/postgres";
import { UserDbRow, mapUserProfileRow } from "../db/mappers";

export class UserService {
  /**
   * Retrieves sanitized user profile by ID.
   */
  public static async getProfile(userId: string): Promise<UserProfile | null> {
    const res = await query<UserDbRow>(
      "SELECT * FROM users WHERE id = $1 LIMIT 1;",
      [userId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapUserProfileRow(res.rows[0]);
  }

  /**
   * Updates non-sensitive user profile attributes (name, mobile).
   * Email and Role remain strictly immutable through standard profile update.
   */
  public static async updateProfile(
    userId: string,
    data: { name?: string; mobile?: string }
  ): Promise<UserProfile> {
    const user = await this.getProfile(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new Error("Name cannot be empty.");
      }
      updates.push(`name = $${idx++}`);
      params.push(data.name.trim());
    }

    if (data.mobile !== undefined) {
      updates.push(`mobile = $${idx++}`);
      params.push(data.mobile.trim());
    }

    if (updates.length === 0) {
      return user;
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *;`;
    const res = await query<UserDbRow>(sql, params);

    return mapUserProfileRow(res.rows[0]);
  }

  /**
   * Admin-only: Lists user profiles with pagination, search, and filtering.
   * Strips all password and security credential internals.
   */
  public static async listUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: UserProfile[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, Math.min(100, params?.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryParams: unknown[] = [];
    let idx = 1;

    if (params?.search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      queryParams.push(`%${params.search}%`);
      idx++;
    }

    if (params?.role) {
      conditions.push(`role = $${idx}`);
      queryParams.push(params.role);
      idx++;
    }

    if (params?.status) {
      conditions.push(`account_status = $${idx}`);
      queryParams.push(params.status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ count: number }>(
      `SELECT count(*)::int as count FROM users ${whereClause};`,
      queryParams
    );
    const total = countRes.rows[0]?.count || 0;

    const selectParams = [...queryParams, limit, offset];
    const dataRes = await query<UserDbRow>(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1};`,
      selectParams
    );

    return {
      users: dataRes.rows.map(mapUserProfileRow),
      total,
      page,
      limit,
    };
  }

  /**
   * Admin-only: Updates user account status (active, suspended, disabled).
   */
  public static async updateUserStatus(userId: string, status: AccountStatus): Promise<UserProfile> {
    const validStatuses: AccountStatus[] = ["pending_verification", "active", "suspended", "disabled"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid account status: ${status}`);
    }

    const res = await query<UserDbRow>(
      `UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [status, userId]
    );

    if (res.rows.length === 0) {
      throw new Error("User not found.");
    }

    return mapUserProfileRow(res.rows[0]);
  }

  /**
   * Admin-only: Updates user role.
   */
  public static async updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    const validRoles: UserRole[] = ["admin", "engineer", "owner", "public"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const res = await query<UserDbRow>(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [role, userId]
    );

    if (res.rows.length === 0) {
      throw new Error("User not found.");
    }

    return mapUserProfileRow(res.rows[0]);
  }

  /**
   * Admin-only: Creates a privileged or controlled account directly.
   */
  public static async adminCreateUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    mobile?: string;
  }): Promise<UserProfile> {
    const emailNorm = data.email.toLowerCase().trim();

    if (data.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const existing = await query("SELECT id FROM users WHERE email = $1 LIMIT 1;", [emailNorm]);
    if (existing.rows.length > 0) {
      throw new Error("User with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const res = await query<UserDbRow>(
      `INSERT INTO users (
        id, name, email, password, role, mobile, account_status, email_verified_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW(), NOW())
      RETURNING *;`,
      [newId, data.name.trim(), emailNorm, hashedPassword, data.role, data.mobile || null]
    );

    return mapUserProfileRow(res.rows[0]);
  }
}

