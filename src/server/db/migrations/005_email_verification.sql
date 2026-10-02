-- Migration 005: Email Verification & Token Security Hardening
-- Adds email_verified boolean attribute and performance index for token lookup

-- 1. Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Synchronize email_verified with existing verified accounts
UPDATE users SET email_verified = TRUE WHERE email_verified_at IS NOT NULL;

-- 3. High-performance index for token hash lookups during link verification
CREATE INDEX IF NOT EXISTS idx_otp_hash ON otp_verifications(otp_hash);
