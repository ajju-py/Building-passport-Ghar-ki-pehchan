import { resolveVerificationBaseUrl } from "../../config/env";

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EmailVerificationTemplateOptions {
  token: string;
  otp?: string;
  expiryMinutes?: number;
  baseUrl?: string;
}

export class EmailTemplates {
  /**
   * Generates email verification template with branding, verification link, button, fallback URL, expiry, and security notice.
   */
  public static getEmailVerificationTemplate(
    tokenOrOptions: string | EmailVerificationTemplateOptions,
    expiryMinutesArg: number = 10
  ): RenderedEmail {
    let token: string;
    let otp: string | undefined;
    let expiryMinutes = expiryMinutesArg;
    let candidateBaseUrl: string | undefined;

    if (typeof tokenOrOptions === "string") {
      token = tokenOrOptions;
      otp = tokenOrOptions.length === 6 && /^\d+$/.test(tokenOrOptions) ? tokenOrOptions : undefined;
    } else {
      token = tokenOrOptions.token;
      otp = tokenOrOptions.otp;
      expiryMinutes = tokenOrOptions.expiryMinutes ?? 10;
      candidateBaseUrl = tokenOrOptions.baseUrl;
    }

    const baseUrl = resolveVerificationBaseUrl(candidateBaseUrl);
    const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = "Verify your Building Passport account";

    const text = `
Building Passport — Ghar Ki Pehchan
Civil Infrastructure & Asset Registry

Verify Your Account

Thank you for registering with the Building Passport civil registry platform.
Please verify your email address to complete your registration and activate your account.

Verify Account:
${verificationUrl}

${otp ? `Verification Code: ${otp}\n` : ""}This verification link will expire in ${expiryMinutes} minutes.

Security Notice:
If you did not create an account on Building Passport, please disregard this email. Your email will not be activated without using this verification link.

Need help? Contact the Building Passport Administrative Office.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 28px 32px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: 'SF Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 32px; }
    .content h2 { margin-top: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .intro { font-size: 14px; color: #334155; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em; text-align: center; }
    .btn:hover { background-color: #1e293b; }
    .otp-card { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; padding: 16px; margin: 24px 0; }
    .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0284c7; }
    .otp-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .expiry { font-size: 13px; color: #64748b; text-align: center; margin-top: 12px; }
    .fallback-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .fallback-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; }
    .fallback-url { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 11px; word-break: break-all; color: #0284c7; }
    .notice { font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; }
    .footer { background: #f8fafc; padding: 18px 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Building Passport — Ghar Ki Pehchan</h1>
      <p>Civil Infrastructure &amp; Asset Lifecycle Registry</p>
    </div>
    <div class="content">
      <h2>Verify your Building Passport account</h2>
      <p class="intro">
        Thank you for registering with the Building Passport civil registry platform. Please confirm your email address using the button below to complete registration and activate your account.
      </p>

      <div class="btn-container">
        <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          Verify Account &amp; Activate Passport
        </a>
      </div>

      ${
        otp
          ? `
      <div class="otp-card">
        <div class="otp-sub">Manual Verification Code</div>
        <div class="otp-code">${otp}</div>
      </div>
      `
          : ""
      }

      <div class="expiry">
        This verification link will expire in <strong>${expiryMinutes} minutes</strong>.
      </div>

      <div class="fallback-section">
        <div class="fallback-label">Or copy and paste this verification URL into your browser:</div>
        <div class="fallback-url">${verificationUrl}</div>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> If you did not create an account on Building Passport, no further action is required and you may safely disregard this email. Your email address will not be activated without this verification link.
      </div>
    </div>
    <div class="footer">
      Building Passport Registry &bull; Civil Digital Identity &bull; National Civil Engineering Standards
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  /**
   * Generates password reset template with branding, OTP, expiry, and security advice.
   */
  public static getPasswordResetTemplate(otp: string, expiryMinutes: number = 10): RenderedEmail {
    const subject = "Reset your Building Passport password";
    const text = `
Building Passport — Ghar Ki Pehchan
Civil Infrastructure & Asset Registry

Password Reset Request

We received a request to reset the password for your Building Passport account.
To proceed with the password reset, enter the following code:

Reset Code: ${otp}

This code will expire in ${expiryMinutes} minutes.

Security Notice:
If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.

Need help? Contact the Building Passport Administrative Office.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; color: #ffffff; padding: 24px 32px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px; }
    .otp-card { background: #fef2f2; border: 1px dashed #fecaca; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
    .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #dc2626; }
    .expiry { font-size: 13px; color: #991b1b; margin-top: 8px; }
    .notice { font-size: 13px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; }
    .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Building Passport — Ghar Ki Pehchan</h1>
      <p>Civil Infrastructure & Asset Lifecycle Registry</p>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>A password reset request was initiated for your account. Use the one-time code below to establish a new password:</p>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Valid for ${expiryMinutes} minutes</div>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> If you did not make this request, ignore this email. Do not share this code with anyone. Municipal administrators will never ask for your reset code.
      </div>
    </div>
    <div class="footer">
      Building Passport Registry &bull; National Civil Engineering & Asset Standards
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }
}

