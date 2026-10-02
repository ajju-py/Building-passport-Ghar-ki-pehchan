import nodemailer, { Transporter } from "nodemailer";
import { IEmailProvider, EmailPayload, EmailSendResult } from "./notification.interface";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  password?: string;
  fromName?: string;
  fromEmail?: string;
  from?: string;
}

export class SmtpEmailProvider implements IEmailProvider {
  public readonly name: string;
  private transporter: Transporter;
  private from: string;
  private config: SmtpConfig;

  constructor(config?: Partial<SmtpConfig>) {
    const host = config?.host || process.env.SMTP_HOST || "smtp.gmail.com";
    const port = config?.port || Number(process.env.SMTP_PORT) || 587;
    const secure = config?.secure ?? (process.env.SMTP_SECURE === "true" || port === 465);
    const user = config?.user || process.env.SMTP_USER || "buildingpassport.india@gmail.com";
    const password = config?.password || process.env.SMTP_PASSWORD;
    const fromName = config?.fromName || process.env.EMAIL_FROM_NAME || "Building Passport";
    const fromEmail =
      config?.fromEmail || process.env.EMAIL_FROM_EMAIL || user || "buildingpassport.india@gmail.com";
    const from =
      config?.from ||
      (process.env.EMAIL_FROM_NAME && process.env.EMAIL_FROM_EMAIL
        ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_EMAIL}>`
        : process.env.EMAIL_FROM || `${fromName} <${fromEmail}>`);

    this.config = { host, port, secure, user, password, fromName, fromEmail, from };
    this.from = from;
    this.name = host.toLowerCase().includes("gmail") || process.env.EMAIL_PROVIDER?.toLowerCase() === "gmail"
      ? "gmail"
      : "smtp";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && password ? { user, pass: password } : undefined,
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  public async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      return {
        success: true,
        messageId: info.messageId,
        simulated: false,
      };
    } catch (err: unknown) {
      const rawError = (err as Error)?.message || "SMTP dispatch error";
      const sanitized = this.sanitizeError(rawError);
      console.error(
        `[SmtpEmailProvider] Dispatch failed for ${payload.purpose} to ${payload.to.replace(/(?<=^.).+(?=@)/, "***")}: ${sanitized}`
      );
      return {
        success: false,
        error: sanitized,
      };
    }
  }

  public async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (err: unknown) {
      const rawError = (err as Error)?.message || "SMTP verification failed";
      return { success: false, error: this.sanitizeError(rawError) };
    }
  }

  private sanitizeError(msg: string): string {
    if (!msg) return "";
    let sanitized = msg;
    if (this.config.password) {
      sanitized = sanitized.split(this.config.password).join("***");
    }
    return sanitized;
  }
}
