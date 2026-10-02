import assert from "node:assert";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AuthService } from "../src/server/services/auth.service";
import { OtpService } from "../src/server/services/otp.service";
import { EmailService } from "../src/server/services/notification/email.service";
import { DevNotificationProvider } from "../src/server/services/notification/devNotification.provider";
import { ResendEmailProvider } from "../src/server/services/notification/resend.provider";
import { query } from "../src/server/db/postgres";

interface TestStats {
  passed: number;
  failed: number;
}

const stats: TestStats = { passed: 0, failed: 0 };

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      stats.passed++;
    } catch (err: unknown) {
      console.error(`[FAIL] ${name}:`, (err as Error).message);
      stats.failed++;
    }
  };
}

async function runEmailVerificationTestSuite() {
  console.log("==================================================================");
  console.log("   TRANSACTIONAL EMAIL VERIFICATION & RESEND TEST SUITE           ");
  console.log("==================================================================");

  // Set DevProvider for deterministic in-memory audit testing
  const devProvider = new DevNotificationProvider();
  EmailService.setProvider(devProvider);

  const timestamp = Date.now();
  const testEmail = `verify_audit_${timestamp}@civiltesting.org`;
  const testPassword = "ValidCivilPassword#2026";
  let createdUserId = "";
  let extractedToken = "";

  // 1. Registration creates an unverified account
  await test("1. Registration creates an unverified account in PostgreSQL", async () => {
    const regResult = await AuthService.register({
      name: "Civil Engineer Testing",
      email: testEmail,
      password: testPassword,
      role: "owner",
    });

    createdUserId = regResult.user.userId;

    const userRes = await query<{ account_status: string; email_verified: boolean; email_verified_at: Date | null }>(
      "SELECT account_status, email_verified, email_verified_at FROM users WHERE id = $1;",
      [createdUserId]
    );

    assert(userRes.rows.length === 1, "User record must exist in PostgreSQL");
    const u = userRes.rows[0];
    assert.strictEqual(u.account_status, "pending_verification", "Account status must be pending_verification");
    assert.strictEqual(u.email_verified, false, "email_verified boolean must be false");
    assert.strictEqual(u.email_verified_at, null, "email_verified_at must be NULL");
  })();

  // 2. Password is hashed with bcrypt
  await test("2. Password is secure bcrypt hash (never plaintext)", async () => {
    const pwdRes = await query<{ password: string }>(
      "SELECT password FROM users WHERE id = $1;",
      [createdUserId]
    );
    const hash = pwdRes.rows[0].password;
    assert(!hash.includes(testPassword), "Plaintext password must not be stored");
    assert(hash.startsWith("$2a$") || hash.startsWith("$2b$"), "Password must use bcrypt format");
    const match = await bcrypt.compare(testPassword, hash);
    assert.strictEqual(match, true, "Bcrypt hash must match registration password");
  })();

  // 3. Verification token is cryptographically generated and hashed
  await test("3. Verification token is cryptographically generated (only SHA-256 hash in DB)", async () => {
    extractedToken = DevNotificationProvider.getLatestDevToken(testEmail)!;
    assert(extractedToken, "A verification token must have been dispatched to DevProvider");
    assert(extractedToken.length >= 32, "Token must be cryptographically secure length (>= 32 chars)");

    const tokenHash = crypto.createHash("sha256").update(extractedToken).digest("hex");

    const otpRes = await query<{ id: string; otp_hash: string; consumed_at: Date | null; destination: string }>(
      "SELECT id, otp_hash, consumed_at, destination FROM otp_verifications WHERE user_id = $1 AND otp_hash = $2;",
      [createdUserId, tokenHash]
    );

    assert(otpRes.rows.length === 1, "SHA-256 hash of token must be stored in otp_verifications");
    assert.strictEqual(otpRes.rows[0].consumed_at, null, "Token must be unconsumed initially");
  })();

  // 4. Verification token expires
  await test("4. Verification token expiration is recorded and verifiable", async () => {
    const tokenHash = crypto.createHash("sha256").update(extractedToken).digest("hex");
    const expRes = await query<{ expires_at: Date }>(
      "SELECT expires_at FROM otp_verifications WHERE otp_hash = $1;",
      [tokenHash]
    );
    const expiresAt = new Date(expRes.rows[0].expires_at).getTime();
    assert(expiresAt > Date.now(), "Token must expire in the future");
    assert(expiresAt <= Date.now() + 65 * 60 * 1000, "Token expiry must be within expected timeframe (~60 mins)");
  })();

  // 5. Unverified user cannot perform normal login
  await test("5. Unverified user is blocked from logging in with safe message", async () => {
    let loginFailed = false;
    let errorMsg = "";
    try {
      await AuthService.login({
        email: testEmail,
        password: testPassword,
      });
    } catch (err: unknown) {
      loginFailed = true;
      errorMsg = (err as Error).message;
    }
    assert.strictEqual(loginFailed, true, "Unverified user login must fail");
    assert.strictEqual(errorMsg, "Please verify your email address before signing in.", "Error must be canonical safe message");
  })();

  // 6. Verification fails with invalid token
  await test("6. Verification fails with invalid or malformed token", async () => {
    const invalidResult = await AuthService.verifyEmailToken("invalid_fake_token_1234567890abcdef");
    assert.strictEqual(invalidResult.success, false, "Invalid token must return success: false");
    assert.strictEqual(invalidResult.reason, "INVALID_TOKEN", "Reason must be INVALID_TOKEN");
  })();

  // 7. Verification fails with expired token
  await test("7. Verification fails when token is expired", async () => {
    const expiredToken = "expired_token_mock_test_123456789abcdef";
    const expiredHash = crypto.createHash("sha256").update(expiredToken).digest("hex");

    await query(
      `INSERT INTO otp_verifications (id, user_id, purpose, destination, otp_hash, expires_at, attempt_count, max_attempts, created_at)
       VALUES ($1, $2, 'EMAIL_VERIFICATION', $3, $4, NOW() - INTERVAL '10 minutes', 0, 1, NOW() - INTERVAL '15 minutes');`,
      [`exp_${Date.now()}`, createdUserId, testEmail, expiredHash]
    );

    const expiredResult = await AuthService.verifyEmailToken(expiredToken);
    assert.strictEqual(expiredResult.success, false, "Expired token must fail");
    assert.strictEqual(expiredResult.reason, "EXPIRED", "Reason must be EXPIRED");
  })();

  // 8. Verification succeeds with valid token
  await test("8. Verification succeeds with valid cryptographic token", async () => {
    const verifyResult = await AuthService.verifyEmailToken(extractedToken);
    assert.strictEqual(verifyResult.success, true, "Valid token verification must succeed");
    assert.strictEqual(verifyResult.userId, createdUserId, "Verified userId must match");

    const userRes = await query<{ account_status: string; email_verified: boolean; email_verified_at: Date | null }>(
      "SELECT account_status, email_verified, email_verified_at FROM users WHERE id = $1;",
      [createdUserId]
    );
    const u = userRes.rows[0];
    assert.strictEqual(u.account_status, "active", "Account status must transition to active");
    assert.strictEqual(u.email_verified, true, "email_verified must become true");
    assert(u.email_verified_at !== null, "email_verified_at must be populated");
  })();

  // 9. Verification token cannot be reused (single-use replay defense)
  await test("9. Verification token cannot be reused after consumption", async () => {
    const replayResult = await AuthService.verifyEmailToken(extractedToken);
    assert.strictEqual(replayResult.success, false, "Reused token must fail");
    assert.strictEqual(replayResult.reason, "ALREADY_USED", "Reason must be ALREADY_USED");
  })();

  // 10. Verified user can now login
  await test("10. Verified user can successfully authenticate and obtain JWT", async () => {
    const authResult = await AuthService.login({
      email: testEmail,
      password: testPassword,
    });
    assert(authResult.token, "JWT token must be issued");
    assert.strictEqual(authResult.user.userId, createdUserId, "Session userId must match");
    assert.strictEqual(authResult.user.accountStatus, "active", "Session account status must be active");
  })();

  // 11. Resend verification flow works and generates fresh token
  await test("11. Resend verification generates new token and invalidates previous", async () => {
    const unverifiedEmail = `resend_test_${Date.now()}@domain.org`;
    const reg = await AuthService.register({
      name: "Resend Tester",
      email: unverifiedEmail,
      password: "StrongPassword#2026",
      role: "owner",
    });

    const firstToken = DevNotificationProvider.getLatestDevToken(unverifiedEmail);
    assert(firstToken, "First token must be generated");

    // Fast-forward cooldown for testing by adjusting created_at in DB
    await query(
      "UPDATE otp_verifications SET created_at = NOW() - INTERVAL '35 seconds' WHERE destination = $1;",
      [unverifiedEmail]
    );

    // Call resend
    const resendRes = await AuthService.resendVerification(unverifiedEmail);
    assert.strictEqual(resendRes.success, true, "Resend verification call must succeed");

    const secondToken = DevNotificationProvider.getLatestDevToken(unverifiedEmail);
    assert(secondToken, "Second token must be generated");
    assert.notStrictEqual(firstToken, secondToken, "Second token must be distinct from first token");

    // First token must now be consumed/invalidated
    const firstTokenVerification = await AuthService.verifyEmailToken(firstToken!);
    assert.strictEqual(firstTokenVerification.success, false, "Previous token must be invalidated");
    assert.strictEqual(firstTokenVerification.reason, "ALREADY_USED", "Previous token reason must be ALREADY_USED");

    // Second token must succeed
    const secondTokenVerification = await AuthService.verifyEmailToken(secondToken!);
    assert.strictEqual(secondTokenVerification.success, true, "New token must succeed");

    // Cleanup
    await query("DELETE FROM users WHERE id = $1;", [reg.user.userId]);
  })();

  // 12. Resend rate limiting cooldown works
  await test("12. Resend cooldown rejects rapid repeated requests", async () => {
    const cooldownEmail = `cooldown_${Date.now()}@domain.org`;
    const reg = await AuthService.register({
      name: "Cooldown Tester",
      email: cooldownEmail,
      password: "StrongPassword#2026",
      role: "owner",
    });

    let cooldownTriggered = false;
    try {
      await OtpService.createAndSendVerificationToken({
        userId: reg.user.userId,
        destination: cooldownEmail,
      });
    } catch (err: unknown) {
      cooldownTriggered = (err as Error).message.includes("Please wait");
    }

    assert.strictEqual(cooldownTriggered, true, "Rapid requests must trigger cooldown rejection");

    // Cleanup
    await query("DELETE FROM users WHERE id = $1;", [reg.user.userId]);
  })();

  // 13. Resend API error handling (no silent fake success)
  await test("13. Resend provider handles delivery errors explicitly without silent fallback", async () => {
    // Instantiate ResendEmailProvider with a dummy key to verify error handling
    const mockProvider = new ResendEmailProvider("re_dummy_invalid_api_key_test_000");
    const result = await mockProvider.sendEmail({
      to: "recipient@testdomain.org",
      subject: "Test Subject",
      text: "Test body",
      html: "<p>Test</p>",
      purpose: "EMAIL_VERIFICATION",
    });

    assert.strictEqual(result.success, false, "Invalid API key must result in success: false");
    assert(result.error !== undefined, "Explicit error message must be returned");
  })();

  // 14. RESEND_API_KEY is server-side only and never exposed
  await test("14. RESEND_API_KEY is protected server-side and absent from client env", () => {
    const clientEnvKeys = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
    const hasResendInClient = clientEnvKeys.some((k) => k.includes("RESEND"));
    assert.strictEqual(hasResendInClient, false, "No RESEND keys permitted with NEXT_PUBLIC_ prefix");
  })();

  // 15. Forgot password flow uses configured email service
  await test("15. Forgot password dispatches reset email through EmailService", async () => {
    const resetEmailRes = await AuthService.forgotPassword(testEmail);
    assert.strictEqual(resetEmailRes.success, true, "Forgot password request must succeed");

    const resetOtp = DevNotificationProvider.getLatestDevOtp(testEmail, "PASSWORD_RESET");
    assert(resetOtp !== undefined, "Password reset OTP must be recorded in email dispatch sink");
    assert.strictEqual(resetOtp.length, 6, "Reset OTP must be 6 digits");
  })();

  // Cleanup test user
  await query("DELETE FROM users WHERE id = $1;", [createdUserId]);

  console.log("\n==================================================================");
  console.log(`  EMAIL VERIFICATION TEST SUMMARY: ${stats.passed} PASSED, ${stats.failed} FAILED`);
  console.log("==================================================================");

  if (stats.failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runEmailVerificationTestSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
