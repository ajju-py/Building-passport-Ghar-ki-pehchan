import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole, UserSession } from "@/lib/types";
import { env } from "../config/env";
import { connectDb, isDbConnected } from "../db";
import { UserModel, IUser } from "../models/User";
import { initialSeedUsers, SeedUser } from "../data/seedData";

// In-memory fallback user repository
const memoryUsers: SeedUser[] = [...initialSeedUsers];

export interface AuthTokens {
  token: string;
  user: UserSession;
}

export class AuthService {
  /**
   * Initializes seed users into MongoDB if DB is connected and empty
   */
  public static async ensureSeedUsers(): Promise<void> {
    try {
      if (!isDbConnected()) {
        await connectDb().catch(() => null);
      }
      if (isDbConnected()) {
        const count = await UserModel.countDocuments();
        if (count === 0) {
          for (const u of initialSeedUsers) {
            await UserModel.create({
              name: u.name,
              email: u.email,
              password: u.rawPasswordForDemo, // Pre-save hook will hash it
              role: u.role,
            });
          }
          console.log("[AuthService] Seeded default users into MongoDB.");
        }
      }
    } catch {
      // Ignored for offline fallback
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
   * Registers a new user account
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<AuthTokens> {
    const emailNormalized = data.email.toLowerCase().trim();
    const role: UserRole = data.role && ["admin", "engineer", "owner", "public"].includes(data.role)
      ? data.role
      : "owner";

    // Try MongoDB
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const existing = await UserModel.findOne({ email: emailNormalized });
        if (existing) {
          throw new Error("An account with this email address already exists.");
        }
        const createdUser = (await UserModel.create({
          name: data.name.trim(),
          email: emailNormalized,
          password: data.password,
          role,
        })) as IUser;

        const sessionUser: UserSession = {
          userId: createdUser._id.toString(),
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
    } catch (err: unknown) {
      if ((err as Error).message.includes("already exists")) {
        throw err;
      }
      console.warn("[AuthService] MongoDB write unavailable, using memory fallback.");
    }

    // In-memory fallback
    const memExisting = memoryUsers.find((u) => u.email === emailNormalized);
    if (memExisting) {
      throw new Error("An account with this email address already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const newUser: SeedUser = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: emailNormalized,
      passwordHash,
      rawPasswordForDemo: data.password,
      role,
    };
    memoryUsers.push(newUser);

    const sessionUser: UserSession = {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
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
   * Authenticates user credentials and returns token
   */
  public static async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const emailNormalized = credentials.email.toLowerCase().trim();

    // Try MongoDB
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const user = await UserModel.findOne({ email: emailNormalized }).select("+password");
        if (user) {
          const match = await user.comparePassword(credentials.password);
          if (!match) {
            throw new Error("Invalid email or password.");
          }
          const sessionUser: UserSession = {
            userId: user._id.toString(),
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
      }
    } catch (err: unknown) {
      if ((err as Error).message === "Invalid email or password.") {
        throw err;
      }
      console.warn("[AuthService] MongoDB lookup unavailable, trying memory store.");
    }

    // In-memory fallback
    const memUser = memoryUsers.find((u) => u.email === emailNormalized);
    if (!memUser) {
      throw new Error("Invalid email or password.");
    }

    // If matches raw password or bcrypt compare
    let isMatch = credentials.password === memUser.rawPasswordForDemo;
    if (!isMatch && memUser.passwordHash) {
      isMatch = await bcrypt.compare(credentials.password, memUser.passwordHash);
    }

    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser: UserSession = {
      userId: memUser.id,
      name: memUser.name,
      email: memUser.email,
      role: memUser.role,
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
   * Finds user by ID
   */
  public static async findById(id: string): Promise<UserSession | null> {
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const user = await UserModel.findById(id);
        if (user) {
          return {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
      }
    } catch {
      // Memory fallback
    }

    const memUser = memoryUsers.find((u) => u.id === id);
    if (memUser) {
      return {
        userId: memUser.id,
        name: memUser.name,
        email: memUser.email,
        role: memUser.role,
      };
    }
    return null;
  }
}
