import QRCode from "qrcode";
import { env } from "../config/env";

export class QrService {
  /**
   * Generates the public verification URL for a given Building Passport ID.
   */
  public static getPublicUrl(passportId: string): string {
    const baseUrl = env.APP_URL.replace(/\/$/, "");
    return `${baseUrl}/public/building/${encodeURIComponent(passportId)}`;
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
}
