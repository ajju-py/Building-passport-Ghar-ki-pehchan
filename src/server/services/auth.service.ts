import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole, UserSession } from "@/lib/types";
import { env } from "../config/env";
import { query } from "../db/postgres";
import { initialSeedUsers } from "../data/seedData";

export interface AuthTokens {
  token: string;
  user: UserSession;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export class AuthService {
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
            `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
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
   * Generates a signed JWT for an authenticated user session
   */
  public static signToken(user: { id: string; email: string; name: string; role: UserRole }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Verifies and extracts session from a JWT string
   */
  public static verifyToken(token: string): UserSession | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        name: string;
        role: UserRole;
      };
      return {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  }

  /**
   * Registers a new user account in PostgreSQL
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<AuthTokens> {
    const emailNormalized = data.email.toLowerCase().trim();
    // Service-level security boundary:
    // Public self-registration only permits unprivileged roles ('owner' or 'public').
    // Attempts to self-register as 'admin' or 'engineer' are strictly prohibited and fall back to 'owner'.
    const role: UserRole = data.role === "public" ? "public" : "owner";

    // Duplicate email detection via parameterized query
    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1;",
      [emailNormalized]
    );

    if (existing.rows.length > 0) {
      throw new Error("An account with this email address already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const res = await query<UserRow>(
      `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, name, email, role;`,
      [userId, data.name.trim(), emailNormalized, passwordHash, role]
    );

    const createdUser = res.rows[0];

    const sessionUser: UserSession = {
      userId: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
    };

    const token = this.signToken({
      id: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
    });

    return { token, user: sessionUser };
  }

  /**
   * Authenticates user credentials via PostgreSQL and returns token
   */
  public static async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const emailNormalized = credentials.email.toLowerCase().trim();

    const res = await query<UserRow>(
      "SELECT id, name, email, password, role FROM users WHERE email = $1 LIMIT 1;",
      [emailNormalized]
    );

    if (res.rows.length === 0) {
      throw new Error("Invalid email or password.");
    }

    const user = res.rows[0];
    const match = await bcrypt.compare(credentials.password, user.password);

    if (!match) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser: UserSession = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = this.signToken({
      id: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
    });

    return { token, user: sessionUser };
  }

  /**
   * Finds user by ID in PostgreSQL
   */
  public static async findById(id: string): Promise<UserSession | null> {
    const res = await query<{ id: string; name: string; email: string; role: UserRole }>(
      "SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1;",
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
    };
  }
}
