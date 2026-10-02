import { Resend } from "resend";
import { IEmailProvider, EmailPayload, EmailSendResult } from "./notification.interface";
import { env } from "@/server/config/env";

export class ResendEmailProvider implements IEmailProvider {
  public readonly name = "ResendEmailProvider";
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey?: string, fromEmail?: string, fromName?: string) {
    const key = apiKey || env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!key || !key.trim()) {
      throw new Error(
        "RESEND_API_KEY is not configured. Outbound transactional emails cannot be delivered via Resend."
      );
    }
    this.resend = new Resend(key.trim());
    this.fromEmail = fromEmail || env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    this.fromName = fromName || env.RESEND_FROM_NAME || process.env.RESEND_FROM_NAME || "Building Passport";
  }

  public async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    const from = `${this.fromName} <${this.fromEmail}>`;

    try {
      const response = await this.resend.emails.send({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (response.error) {
        const errorMsg = response.error.message || "Resend API returned delivery error";
        console.error(
          `[ResendEmailProvider] Dispatch failed for ${payload.purpose} to ${payload.to.replace(/(?<=^.).+(?=@)/, "***")}: ${errorMsg}`
        );
        return {
          success: false,
          error: errorMsg,
        };
      }

      const messageId = response.data?.id;
      return {
        success: true,
        messageId,
      };
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Unknown Resend dispatch exception";
      console.error(
        `[ResendEmailProvider] Unexpected dispatch exception: ${errorMsg.replace(/key=[^&;\s]+/gi, "key=***")}`
      );
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
