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
   * Returns whether Resend API key is configured.
   */
  public static isResendConfigured(): boolean {
    const key = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    return !!key && key.trim().length > 0;
  }

  /**
   * Returns whether an external email delivery provider (e.g. Resend or SMTP) is configured in environment.
   */
  public static isExternalProviderConfigured(): boolean {
    if (this.isResendConfigured()) return true;
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
    const hasSmtpHost = !!process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0;
    return provider === "smtp" || hasSmtpHost;
  }

  /**
   * Retrieves or initializes the active email provider.
   */
  public static getProvider(): IEmailProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    // 1. Resend is the primary real transactional email provider
    if (this.isResendConfigured()) {
      this.providerInstance = new ResendEmailProvider();
      return this.providerInstance;
    }

    const providerType = process.env.EMAIL_PROVIDER?.toLowerCase();
    const isProduction = process.env.NODE_ENV === "production";

    // 2. SMTP provider fallback if explicitly configured
    if (providerType === "smtp" || (!!process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0)) {
      this.providerInstance = new SmtpEmailProvider();
    } else {
      if (isProduction && !env.SHOWCASE_MODE) {
        console.warn(
          "[EmailService:WARNING] In production mode without RESEND_API_KEY or EMAIL_PROVIDER configured. Outbound transactional emails cannot be delivered to mailboxes."
        );
      }
      this.providerInstance = new DevNotificationProvider();
    }

    return this.providerInstance;
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
  }): Promise<EmailSendResult> {
    const expiryMinutes = options.expiryMinutes || 60;
    const template = EmailTemplates.getEmailVerificationTemplate({
      token: options.token,
      otp: options.otp,
      expiryMinutes,
      baseUrl: options.baseUrl,
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
  }): Promise<EmailSendResult> {
    const expiryMinutes = options.expiryMinutes || 10;
    let template;

    if (options.purpose === "EMAIL_VERIFICATION") {
      template = EmailTemplates.getEmailVerificationTemplate(options.otp, expiryMinutes);
    } else if (options.purpose === "PASSWORD_RESET") {
      template = EmailTemplates.getPasswordResetTemplate(options.otp, expiryMinutes);
    } else {
      template = EmailTemplates.getEmailVerificationTemplate(options.otp, expiryMinutes);
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

