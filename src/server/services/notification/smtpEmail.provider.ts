import net from "net";
import tls from "tls";
import { IEmailProvider, EmailPayload, EmailSendResult } from "./notification.interface";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from: string;
}

export class SmtpEmailProvider implements IEmailProvider {
  public readonly name = "smtp";
  private config: SmtpConfig;

  constructor(config?: Partial<SmtpConfig>) {
    this.config = {
      host: config?.host || process.env.SMTP_HOST || "localhost",
      port: config?.port || Number(process.env.SMTP_PORT) || 587,
      secure: config?.secure ?? (process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465),
      user: config?.user || process.env.SMTP_USER,
      password: config?.password || process.env.SMTP_PASSWORD,
      from: config?.from || process.env.EMAIL_FROM || "Building Passport <noreply@buildingpassport.org>",
    };
  }

  public async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    if (!this.config.host || !this.config.host.trim() || (this.config.host === "localhost" && !process.env.SMTP_HOST)) {
      throw new Error("SMTP host is not configured.");
    }

    return new Promise<EmailSendResult>((resolve, reject) => {
      const socket = this.config.secure
        ? tls.connect(this.config.port, this.config.host)
        : net.connect(this.config.port, this.config.host);

      let step = 0;
      let buffer = "";

      const cleanup = () => {
        socket.removeAllListeners();
        socket.end();
      };

      socket.setTimeout(15000, () => {
        cleanup();
        reject(new Error("SMTP connection timed out"));
      });

      socket.on("error", (err) => {
        cleanup();
        reject(new Error(`SMTP connection error: ${this.sanitizeError(err.message)}`));
      });

      socket.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const code = parseInt(line.substring(0, 3), 10);
          if (isNaN(code)) continue;

          // Process SMTP handshake sequence
          if (code >= 400) {
            cleanup();
            return reject(new Error(`SMTP server rejected command: ${code} ${line}`));
          }

          if (step === 0 && code === 220) {
            step++;
            socket.write(`EHLO ${this.config.host}\r\n`);
          } else if (step === 1 && code === 250) {
            if (line.startsWith("250 ")) {
              if (this.config.user && this.config.password) {
                step = 2;
                socket.write("AUTH LOGIN\r\n");
              } else {
                step = 5;
                const fromAddr = this.extractAddress(this.config.from);
                socket.write(`MAIL FROM:<${fromAddr}>\r\n`);
              }
            }
          } else if (step === 2 && code === 334) {
            step = 3;
            socket.write(Buffer.from(this.config.user || "").toString("base64") + "\r\n");
          } else if (step === 3 && code === 334) {
            step = 4;
            socket.write(Buffer.from(this.config.password || "").toString("base64") + "\r\n");
          } else if (step === 4 && code === 235) {
            step = 5;
            const fromAddr = this.extractAddress(this.config.from);
            socket.write(`MAIL FROM:<${fromAddr}>\r\n`);
          } else if (step === 5 && code === 250) {
            step = 6;
            socket.write(`RCPT TO:<${payload.to}>\r\n`);
          } else if (step === 6 && code === 250) {
            step = 7;
            socket.write("DATA\r\n");
          } else if (step === 7 && code === 354) {
            step = 8;
            const boundary = `----=_Part_${Date.now()}`;
            const mime = [
              `From: ${this.config.from}`,
              `To: ${payload.to}`,
              `Subject: ${payload.subject}`,
              "MIME-Version: 1.0",
              `Content-Type: multipart/alternative; boundary="${boundary}"`,
              "",
              `--${boundary}`,
              "Content-Type: text/plain; charset=UTF-8",
              "Content-Transfer-Encoding: 7bit",
              "",
              payload.text,
              "",
              `--${boundary}`,
              "Content-Type: text/html; charset=UTF-8",
              "Content-Transfer-Encoding: 7bit",
              "",
              payload.html,
              "",
              `--${boundary}--`,
              "",
              ".\r\n",
            ].join("\r\n");

            socket.write(mime);
          } else if (step === 8 && code === 250) {
            step = 9;
            socket.write("QUIT\r\n");
            cleanup();
            return resolve({
              success: true,
              messageId: `smtp_${Date.now()}`,
              simulated: false,
            });
          }
        }
      });
    });
  }

  private extractAddress(sender: string): string {
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender.trim();
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


