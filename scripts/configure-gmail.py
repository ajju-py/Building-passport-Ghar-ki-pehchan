#!/usr/bin/env python3
import os
import sys
import getpass
import datetime
import shutil
import subprocess

ENV_PATH = "/opt/building-passport/.env"
NODE_DIR = "/opt/building-passport"

def main():
    if os.geteuid() != 0:
        print("[ERROR] This script must be run as root (or with sudo).")
        sys.exit(1)

    if not os.path.exists(ENV_PATH):
        print(f"[ERROR] {ENV_PATH} not found.")
        sys.exit(1)

    # Resolve optional test recipient from environment variable only
    test_recipient = os.environ.get("GMAIL_TEST_RECIPIENT", "").strip()

    print("==================================================")
    print("   Building Passport - Gmail SMTP Configuration   ")
    print("==================================================")
    print(f"Target file: {ENV_PATH}")
    print("Sender Account: buildingpassport.india@gmail.com")
    if test_recipient:
        masked_recipient = test_recipient
        if "@" in test_recipient:
            parts = test_recipient.split("@", 1)
            name, domain = parts[0], parts[1]
            if len(name) > 2:
                masked_recipient = f"{name[0]}***{name[-1]}@{domain}"
            else:
                masked_recipient = f"{name[0]}***@{domain}"
        print(f"Test Recipient: {masked_recipient} (via GMAIL_TEST_RECIPIENT)")
    else:
        print("Test Recipient: [NOT CONFIGURED - GMAIL_TEST_RECIPIENT not set]")
    print("--------------------------------------------------")

    # 1. Create timestamped backup
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"{ENV_PATH}.backup.{ts}"
    shutil.copyfile(ENV_PATH, backup_path)
    os.chmod(backup_path, 0o600)
    try:
        shutil.chown(backup_path, user="building-passport", group="building-passport")
    except Exception:
        pass
    print(f"[OK] Backup created: {backup_path} (mode 600)")

    # 2. Collect Gmail App Password interactively without echo
    print("\nPlease enter the 16-character Google App Password for buildingpassport.india@gmail.com.")
    print("(Input will not be echoed or displayed on screen)")
    password = getpass.getpass("Enter Gmail App Password: ")
    password = password.strip().replace(" ", "")

    if not password or len(password) < 8:
        print("[ERROR] Invalid App Password (too short or empty). Aborting without making changes.")
        sys.exit(1)

    # 3. Read current .env
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    target_updates = {
        "EMAIL_PROVIDER": "gmail",
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_SECURE": "false",
        "SMTP_USER": "buildingpassport.india@gmail.com",
        "SMTP_PASSWORD": password,
        "EMAIL_FROM_NAME": "Building Passport",
        "EMAIL_FROM_EMAIL": "buildingpassport.india@gmail.com",
    }

    updated_keys = set()
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#") or "=" not in stripped:
            new_lines.append(line)
            continue

        key = stripped.split("=", 1)[0].strip()
        if key in target_updates:
            new_lines.append(f"{key}={target_updates[key]}\n")
            updated_keys.add(key)
        else:
            new_lines.append(line)

    # Append any keys that weren't present
    for key, val in target_updates.items():
        if key not in updated_keys:
            new_lines.append(f"{key}={val}\n")

    # 4. Write back to .env
    temp_path = f"{ENV_PATH}.tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    os.chmod(temp_path, 0o600)
    try:
        shutil.chown(temp_path, user="building-passport", group="building-passport")
    except Exception:
        pass
    os.replace(temp_path, ENV_PATH)
    print(f"[OK] {ENV_PATH} updated securely.")

    # 5. Display variable names only (NEVER values)
    print("\nEnvironment Configuration Status:")
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            k, v = stripped.split("=", 1)
            status = "[CONFIGURED]" if v.strip() else "[EMPTY]"
            print(f"  {k}: {status}")

    # 6. Verify SMTP connection via Node
    print("\n--- Verifying Gmail SMTP Connection ---")
    verify_script = """
const nodemailer = require('/opt/building-passport/node_modules/nodemailer');
require('/opt/building-passport/node_modules/dotenv').config({ path: '/opt/building-passport/.env' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: true }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('VERIFY_FAILED: ' + error.message);
    process.exit(1);
  } else {
    console.log('VERIFY_SUCCESS');
    process.exit(0);
  }
});
"""
    v_res = subprocess.run(["node", "-e", verify_script], capture_output=True, text=True)
    if v_res.returncode == 0 and "VERIFY_SUCCESS" in v_res.stdout:
        print("[OK] Gmail SMTP connection and authentication verified successfully!")
    else:
        err = v_res.stderr.strip() or v_res.stdout.strip()
        print(f"[ERROR] SMTP verification failed: {err}")
        print("Please check that the App Password is valid and 2-Step Verification is enabled on the account.")
        return

    # 7. Restart building-passport service
    print("\n--- Restarting building-passport.service ---")
    subprocess.run(["systemctl", "restart", "building-passport.service"], check=True)
    svc_status = subprocess.run(["systemctl", "is-active", "building-passport.service"], capture_output=True, text=True)
    print(f"Service status: {svc_status.stdout.strip()}")

    # 8. Check health endpoint
    print("\n--- Verifying Backend Health ---")
    try:
        health_res = subprocess.run(["curl", "-s", "http://127.0.0.1:5000/api/health"], capture_output=True, text=True, timeout=5)
        print(f"Health check: {health_res.stdout.strip()}")
    except Exception as e:
        print(f"Health check warning: {e}")

    # 9. Send real test email ONLY if GMAIL_TEST_RECIPIENT is provided
    print("\n--- Test Email Dispatch ---")
    if not test_recipient:
        print("[INFO] GMAIL_TEST_RECIPIENT is not configured.")
        print("[INFO] Skipping test email dispatch. (Failing safely: will not send to undefined recipient)")
        print("[INFO] To dispatch a test email, run with: GMAIL_TEST_RECIPIENT=<recipient@domain.com> ./configure-gmail.sh")
    elif "@" not in test_recipient or "." not in test_recipient.split("@")[-1]:
        print("[ERROR] GMAIL_TEST_RECIPIENT is not a valid email address. Aborting test email dispatch.")
    else:
        print("Dispatching test email to configured recipient...")
        test_email_script = f"""
const nodemailer = require('/opt/building-passport/node_modules/nodemailer');
require('/opt/building-passport/node_modules/dotenv').config({{ path: '/opt/building-passport/.env' }});

const recipient = process.env.GMAIL_TEST_RECIPIENT || {repr(test_recipient)};

const transporter = nodemailer.createTransport({{
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {{
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }},
  tls: {{ rejectUnauthorized: true }}
}});

const mailOptions = {{
  from: `"${{process.env.EMAIL_FROM_NAME || 'Building Passport'}}" <${{process.env.EMAIL_FROM_EMAIL || process.env.SMTP_USER}}>`,
  to: recipient,
  subject: 'Building Passport - Gmail SMTP Integration Verification',
  text: 'This is a verification test email from Building Passport (Ghar Ki Pehchan) sent via Gmail SMTP.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b; margin-top: 0;">Building Passport - Ghar Ki Pehchan</h2>
      <p style="font-size: 16px; color: #334155;">Hello,</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.6;">
        This email confirms that <strong>Gmail SMTP transactional delivery</strong> has been successfully configured and activated on the production Building Passport server.
      </p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Provider:</strong> Gmail SMTP</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Sender:</strong> Building Passport &lt;buildingpassport.india@gmail.com&gt;</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> Active &amp; Verified</p>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        Building Passport &bull; Digital Infrastructure for Structural Safety &amp; Compliance
      </p>
    </div>
  `
}};

transporter.sendMail(mailOptions, (error, info) => {{
  if (error) {{
    console.error('SEND_FAILED: ' + error.message);
    process.exit(1);
  }} else {{
    console.log('SEND_SUCCESS: ' + info.messageId);
    process.exit(0);
  }}
}});
"""
        send_res = subprocess.run(["node", "-e", test_email_script], capture_output=True, text=True)
        if send_res.returncode == 0 and "SEND_SUCCESS" in send_res.stdout:
            msg_id = send_res.stdout.strip().replace("SEND_SUCCESS: ", "")
            print("[OK] Real test email successfully dispatched!")
            print(f"[OK] Message ID: {msg_id}")
        else:
            err = send_res.stderr.strip() or send_res.stdout.strip()
            print(f"[ERROR] Test email dispatch failed: {err}")

    print("\n==================================================")
    print("   Gmail SMTP Configuration Complete!             ")
    print("==================================================")

if __name__ == "__main__":
    main()
