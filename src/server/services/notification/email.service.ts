import { IEmailProvider, EmailSendResult } from "./notification.interface";
import { DevNotificationProvider } from "./devNotification.provider";
import { SmtpEmailProvider } from "./smtpEmail.provider";
import { EmailTemplates } from "./emailTemplates";
import { OtpPurpose } from "@/lib/types";
import { env } from "@/server/config/env";

export class EmailService {
  private static providerInstance: IEmailProvider | null = null;

  /**
   * Returns whether an external email delivery provider (e.g. SMTP) is configured in environment.
   */
  public static isExternalProviderConfigured(): boolean {
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

    const providerType = process.env.EMAIL_PROVIDER?.toLowerCase();
    const isProduction = process.env.NODE_ENV === "production";

    if (env.SHOWCASE_MODE) {
      // Force dev provider in showcase mode, overriding any external configuration
      this.providerInstance = new DevNotificationProvider();
    } else if (providerType === "smtp" || this.isExternalProviderConfigured()) {
      this.providerInstance = new SmtpEmailProvider();
    } else {
      if (isProduction) {
        console.warn(
          "[EmailService:WARNING] In production mode without EMAIL_PROVIDER configured. Outbound transactional emails cannot be delivered to mailboxes."
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
      return await provider.sendEmail({
        to: options.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        purpose: options.purpose,
      });
    } catch (err: unknown) {
      // In production, never leak credentials or full provider internals to logs
      const rawMsg = (err as Error)?.message || "Email dispatch failed";
      const sanitized = rawMsg
        .replace(/password=[^&;\s]+/gi, "password=***")
        .replace(/(AUTH LOGIN\s+)[A-Za-z0-9+/=]+/gi, "$1***");
      console.error(`[EmailService] Failed to dispatch ${options.purpose} email: ${sanitized}`);
      throw new Error("Unable to deliver verification email. Please try again later.");
    }
  }
}

