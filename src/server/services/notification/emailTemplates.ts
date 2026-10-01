export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export class EmailTemplates {
  /**
   * Generates email verification template with branding, OTP, expiry, and security advice.
   */
  public static getEmailVerificationTemplate(otp: string, expiryMinutes: number = 10): RenderedEmail {
    const subject = "Verify your Building Passport account";
    const text = `
Building Passport — Ghar Ki Pehchan
Civil Infrastructure & Asset Registry

Verify Your Account

Thank you for registering with the Building Passport registry.
To complete your account verification, enter the following one-time password (OTP):

Verification Code: ${otp}

This code will expire in ${expiryMinutes} minutes.

Security Notice:
If you did not initiate this registration, please disregard this email. Your email will not be activated without this verification code.

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
    .otp-card { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
    .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0284c7; }
    .expiry { font-size: 13px; color: #64748b; margin-top: 8px; }
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
      <h2>Verify your email address</h2>
      <p>Thank you for registering with the Building Passport platform. Please use the verification code below to confirm your email and activate your account:</p>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Valid for ${expiryMinutes} minutes</div>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> If you did not create an account on Building Passport, no action is required and you may safely ignore this message.
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

