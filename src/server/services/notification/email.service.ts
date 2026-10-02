import { IEmailProvider, EmailSendResult } from "./notification.interface";
import { DevNotificationProvider } from "./devNotification.provider";
import { SmtpEmailProvider } from "./smtpEmail.provider";
import { ResendEmailProvider } from "./resend.provider";
import { EmailTemplates } from "./emailTemplates";
import { OtpPurpose } from "@/lib/types";
import { env } from "@/server/config/env";

export class EmailService {
  private static providerInstance: IEmailProvider | null = null;

  /**
   * Returns whether SMTP (e.g. Gmail) is configured in environment.
   */
  public static isSmtpConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    return !!(
      host &&
      host.trim().length > 0 &&
      user &&
      user.trim().length > 0 &&
      password &&
      password.trim().length > 0
    );
  }

  /**
   * Returns whether Resend API key is configured.
   */
  public static isResendConfigured(): boolean {
    const key = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    return !!key && key.trim().length > 0;
  }

  /**
   * Returns whether an external email delivery provider (e.g. Gmail/SMTP or Resend) is configured in environment.
   */
  public static isExternalProviderConfigured(): boolean {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase().trim();
    if (provider === "gmail" || provider === "smtp") {
      return this.isSmtpConfigured();
    }
    if (provider === "resend") {
      return this.isResendConfigured();
    }
    return this.isSmtpConfigured() || this.isResendConfigured();
  }

  /**
   * Retrieves or initializes the active email provider.
   */
  public static getProvider(): IEmailProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const providerType = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Gmail / SMTP provider (Active production provider when configured or specified)
    if (
      providerType === "gmail" ||
      providerType === "smtp" ||
      (this.isSmtpConfigured() && providerType !== "resend" && providerType !== "development")
    ) {
      this.providerInstance = new SmtpEmailProvider();
      return this.providerInstance;
    }

    // 2. Resend provider (Retained as optional provider/fallback)
    if (providerType === "resend" || (this.isResendConfigured() && !providerType)) {
      this.providerInstance = new ResendEmailProvider();
      return this.providerInstance;
    }

    // 3. Fallback: Dev notification provider (mock in-memory for testing / development)
    if (isProduction && !env.SHOWCASE_MODE && !this.isSmtpConfigured() && !this.isResendConfigured()) {
      console.warn(
        "[EmailService:WARNING] In production mode without SMTP or RESEND configured. Outbound transactional emails cannot be delivered to mailboxes."
      );
    }
    this.providerInstance = new DevNotificationProvider();
    return this.providerInstance;
  }

  /**
   * Explicitly verifies the active SMTP connection.
   */
  public static async verifyConnection(): Promise<{ success: boolean; provider: string; error?: string }> {
    const provider = this.getProvider();
    if (provider.verifyConnection && typeof provider.verifyConnection === "function") {
      const res = await provider.verifyConnection();
      return { success: res.success, provider: provider.name, error: res.error };
    }
    return { success: true, provider: provider.name };
  }

  /**
   * For testing or reconfiguration: explicitly sets or clears the email provider.
   */
  public static setProvider(provider: IEmailProvider | null): void {
    this.providerInstance = provider;
  }

  /**
   * Dispatches a verification email with cryptographic link and optional OTP code.
   */
  public static async sendVerificationEmail(options: {
    to: string;
    token: string;
    otp?: string;
    expiryMinutes?: number;
    baseUrl?: string;
    userName?: string;
  }): Promise<EmailSendResult> {
    const expiryMinutes = options.expiryMinutes || 30;
    const template = EmailTemplates.getEmailVerificationTemplate({
      token: options.token,
      expiryMinutes,
      baseUrl: options.baseUrl,
      userName: options.userName,
    });

    const provider = this.getProvider();

    try {
      const result = await provider.sendEmail({
        to: options.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        purpose: "EMAIL_VERIFICATION",
      });

      if (!result.success) {
        const sanitized = (result.error || "Email delivery failed")
          .replace(/key=[^&;\s]+/gi, "key=***")
          .replace(/password=[^&;\s]+/gi, "password=***");
        console.error(`[EmailService] Failed to dispatch EMAIL_VERIFICATION email: ${sanitized}`);
        throw new Error(`Unable to deliver verification email: ${sanitized}`);
      }

      return result;
    } catch (err: unknown) {
      const rawMsg = (err as Error)?.message || "Email dispatch failed";
      const sanitized = rawMsg
        .replace(/key=[^&;\s]+/gi, "key=***")
        .replace(/password=[^&;\s]+/gi, "password=***")
        .replace(/(AUTH LOGIN\s+)[A-Za-z0-9+/=]+/gi, "$1***");
      console.error(`[EmailService] Failed to dispatch EMAIL_VERIFICATION email: ${sanitized}`);
      throw new Error(`Unable to deliver verification email: ${sanitized}`);
    }
  }

  /**
   * Formats and dispatches an OTP email (verification or password reset) using transactional templates.
   */
  public static async sendOtpEmail(options: {
    to: string;
    otp: string;
    purpose: OtpPurpose;
    expiryMinutes?: number;
    userName?: string;
  }): Promise<EmailSendResult> {
    const expiryMinutes = options.expiryMinutes || 10;
    let template;

    if (options.purpose === "EMAIL_VERIFICATION") {
      template = EmailTemplates.getEmailVerificationTemplate({
        token: options.otp,
        otp: options.otp,
        expiryMinutes,
        userName: options.userName,
      });
    } else if (options.purpose === "PASSWORD_RESET") {
      template = EmailTemplates.getPasswordResetTemplate(options.otp, expiryMinutes);
    } else {
      template = EmailTemplates.getEmailVerificationTemplate({
        token: options.otp,
        otp: options.otp,
        expiryMinutes,
        userName: options.userName,
      });
    }

    const provider = this.getProvider();

    try {
      const result = await provider.sendEmail({
        to: options.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        purpose: options.purpose,
      });

      if (!result.success) {
        const sanitized = (result.error || "Email delivery failed")
          .replace(/key=[^&;\s]+/gi, "key=***")
          .replace(/password=[^&;\s]+/gi, "password=***");
        console.error(`[EmailService] Failed to dispatch ${options.purpose} email: ${sanitized}`);
        throw new Error(`Unable to deliver verification email: ${sanitized}`);
      }

      return result;
    } catch (err: unknown) {
      // In production, never leak credentials or full provider internals to logs
      const rawMsg = (err as Error)?.message || "Email dispatch failed";
      const sanitized = rawMsg
        .replace(/key=[^&;\s]+/gi, "key=***")
        .replace(/password=[^&;\s]+/gi, "password=***")
        .replace(/(AUTH LOGIN\s+)[A-Za-z0-9+/=]+/gi, "$1***");
      console.error(`[EmailService] Failed to dispatch ${options.purpose} email: ${sanitized}`);
      throw new Error("Unable to deliver verification email. Please try again later.");
    }
  }
}

