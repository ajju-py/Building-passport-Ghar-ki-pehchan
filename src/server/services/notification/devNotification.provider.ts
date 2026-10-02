import { IEmailProvider, EmailPayload, EmailSendResult } from "./notification.interface";
import { OtpPurpose } from "@/lib/types";
import { env } from "@/server/config/env";

export interface DispatchedEmailRecord {
  to: string;
  subject: string;
  text: string;
  html: string;
  purpose: OtpPurpose;
  timestamp: Date;
  otp?: string;
  token?: string;
}

export class DevNotificationProvider implements IEmailProvider {
  public readonly name = "development_in_memory";
  private static emailQueue: DispatchedEmailRecord[] = [];

  /**
   * Dispatches email to in-memory audit queue for development and testing.
   */
  public async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const isProduction = process.env.NODE_ENV === "production";
    const isShowcase = env.SHOWCASE_MODE;
    const canExtractOtp = !isProduction || isShowcase;

    // Extract OTP and Token for testing sink in development or showcase mode
    let extractedOtp: string | undefined;
    let extractedToken: string | undefined;
    if (canExtractOtp) {
      const match = payload.text.match(/(?:Verification Code|Reset Code):\s*([0-9]{6})/i);
      if (match) {
        extractedOtp = match[1];
      }
      const matchToken = payload.text.match(/token=([a-f0-9]{20,})/i);
      if (matchToken) {
        extractedToken = matchToken[1];
      }
    }

    const record: DispatchedEmailRecord = {
      to: payload.to.toLowerCase(),
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      purpose: payload.purpose,
      timestamp: new Date(),
      otp: canExtractOtp ? extractedOtp : undefined,
      token: canExtractOtp ? extractedToken : undefined,
    };

    DevNotificationProvider.emailQueue.push(record);

    // Logging behavior strictly conforms to production security rules, except in showcase mode
    if (canExtractOtp) {
      if ((process.env.ENABLE_DEV_OTP_CONSOLE_LOG === "true" || isShowcase) && extractedOtp) {
        console.log(`[SHOWCASE/DEV] OTP for ${payload.to} [${payload.purpose}]: ${extractedOtp}`);
      } else {
        console.log(`[DevNotificationProvider] Email dispatched to ${payload.to} for purpose ${payload.purpose}. (Delivery simulated in memory)`);
      }
    }

    return {
      success: true,
      messageId: `dev_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      simulated: true,
    };
  }

  /**
   * Retrieves the most recent OTP dispatched to a destination for testing purposes.
   * Returns undefined in production mode to prevent secret leakage, unless in SHOWCASE_MODE.
   */
  public static getLatestDevOtp(destination: string, purpose?: OtpPurpose): string | undefined {
    if (process.env.NODE_ENV === "production" && !env.SHOWCASE_MODE) {
      return undefined;
    }

    const destNorm = destination.toLowerCase().trim();
    for (let i = this.emailQueue.length - 1; i >= 0; i--) {
      const item = this.emailQueue[i];
      if (item.to === destNorm) {
        if (!purpose || item.purpose === purpose) {
          return item.otp;
        }
      }
    }
    return undefined;
  }

  /**
   * Retrieves the most recent verification token dispatched to a destination for testing purposes.
   * Returns undefined in production mode to prevent secret leakage, unless in SHOWCASE_MODE.
   */
  public static getLatestDevToken(destination: string): string | undefined {
    if (process.env.NODE_ENV === "production" && !env.SHOWCASE_MODE) {
      return undefined;
    }

    const destNorm = destination.toLowerCase().trim();
    for (let i = this.emailQueue.length - 1; i >= 0; i--) {
      const item = this.emailQueue[i];
      if (item.to === destNorm && item.token) {
        return item.token;
      }
    }
    return undefined;
  }

  /**
   * Retrieves all dispatched emails matching destination.
   */
  public static getAllDispatched(destination?: string): DispatchedEmailRecord[] {
    if (destination) {
      const destNorm = destination.toLowerCase().trim();
      return this.emailQueue.filter((e) => e.to === destNorm);
    }
    return [...this.emailQueue];
  }

  /**
   * Clears the in-memory test queue.
   */
  public static clear(): void {
    this.emailQueue = [];
  }
}

