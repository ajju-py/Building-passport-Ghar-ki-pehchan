import { OtpPurpose } from "@/lib/types";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  purpose: OtpPurpose;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface IEmailProvider {
  readonly name: string;
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;
}

