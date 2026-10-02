import QRCode from "qrcode";
import { env } from "../config/env";

export const CANONICAL_PUBLIC_APP_URL = "https://mdm-building-passport.vercel.app";

export interface QrUrlValidationResult {
  valid: boolean;
  resolvedUrl: string;
  error?: string;
}

/**
 * Validates and resolves the base application URL for QR code generation.
 * In production or showcase mode, strictly enforces HTTPS and rejects internal/tunnel hosts.
 */
export function validateAndResolveQrBaseUrl(
  configuredUrl?: string,
  mode: "development" | "production" | "showcase" = "development"
): QrUrlValidationResult {
  const isProdOrShowcase = mode === "production" || mode === "showcase";
  let target = configuredUrl?.trim() || "";

  // In production/showcase, default to canonical Vercel showcase URL if unconfigured
  if (!target) {
    if (isProdOrShowcase) {
      target = CANONICAL_PUBLIC_APP_URL;
    } else {
      target = "http://localhost:3000";
    }
  }

  // Normalize by stripping trailing slashes
  target = target.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return {
      valid: false,
      resolvedUrl: "",
      error: `Invalid URL format for QR generation: "${target}"`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const pathname = parsed.pathname.replace(/\/+$/, "").toLowerCase();

  // Reject paths containing backend or API routes
  if (pathname.includes("/api") || pathname.includes("/backend")) {
    return {
      valid: false,
      resolvedUrl: "",
      error: `QR base URL must not contain backend or API path: "${target}"`,
    };
  }

  // In production or showcase mode, strictly reject internal or temporary tunnel hosts
  if (isProdOrShowcase) {
    const isUnsafeHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("100.70.") ||
      hostname.endsWith(".trycloudflare.com") ||
      hostname === "trycloudflare.com";

    if (isUnsafeHost) {
      return {
        valid: false,
        resolvedUrl: "",
        error: `Production/showcase QR base URL cannot use internal/tunnel host: "${hostname}". Must use canonical public domain.`,
      };
    }

    if (protocol !== "https:") {
      return {
        valid: false,
        resolvedUrl: "",
        error: `Production/showcase QR base URL must use HTTPS. Received: "${protocol}".`,
      };
    }
  }

  return {
    valid: true,
    resolvedUrl: parsed.origin,
  };
}

export class QrService {
  /**
   * Resolves the verified base URL according to current runtime environment.
   * Never silently falls back to localhost in production or showcase mode.
   */
  public static getBaseUrl(): string {
    const mode: "development" | "production" | "showcase" =
      process.env.NODE_ENV === "production"
        ? "production"
        : process.env.SHOWCASE_MODE === "true" || env.SHOWCASE_MODE
        ? "showcase"
        : "development";

    const configured = process.env.NEXT_PUBLIC_APP_URL || env.APP_URL;
    const result = validateAndResolveQrBaseUrl(configured, mode);

    if (!result.valid) {
      throw new Error(`[QrService Security Error] ${result.error}`);
    }

    return result.resolvedUrl;
  }

  /**
   * Generates the public verification URL for a given Building Passport ID.
   */
  public static getPublicUrl(passportId: string): string {
    const cleanId = (passportId || "").trim();
    if (!cleanId) {
      throw new Error("Cannot generate public QR URL: Passport ID is missing.");
    }
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/public/building/${encodeURIComponent(cleanId)}`;
  }

  /**
   * Generates a base64 Data URL (PNG) representing the QR code for a public passport URL.
   */
  public static async generatePassportQr(passportId: string): Promise<string> {
    const url = this.getPublicUrl(passportId);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        width: 320,
        color: {
          dark: "#0F172A", // Deep slate
          light: "#FFFFFF",
        },
      });
      return dataUrl;
    } catch (err) {
      console.error("[QrService Error] Failed to generate QR code:", err);
      throw new Error("Failed to generate QR code for building passport.");
    }
  }

  /**
   * Generates an SVG string representing the QR code for a public passport URL.
   */
  public static async generatePassportQrSvg(passportId: string): Promise<string> {
    const url = this.getPublicUrl(passportId);
    try {
      const svg = await QRCode.toString(url, {
        errorCorrectionLevel: "H",
        type: "svg",
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
      return svg;
    } catch (err) {
      console.error("[QrService Error] Failed to generate QR SVG:", err);
      throw new Error("Failed to generate QR SVG for building passport.");
    }
  }
}
