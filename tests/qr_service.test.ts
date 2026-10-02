import {
  QrService,
  CANONICAL_PUBLIC_APP_URL,
  validateAndResolveQrBaseUrl,
} from "../src/server/services/qr.service";

async function runQrTests() {
  console.log("==================================================================");
  console.log("             QR DOMAIN & SECURITY HARDENING TEST SUITE            ");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Development URL can work locally
  {
    const res = validateAndResolveQrBaseUrl("http://localhost:3000", "development");
    assert(
      res.valid && res.resolvedUrl === "http://localhost:3000",
      "1. Development URL can work locally (http://localhost:3000)"
    );
  }

  // 2. Showcase URL is HTTPS
  {
    const res = validateAndResolveQrBaseUrl(CANONICAL_PUBLIC_APP_URL, "showcase");
    assert(
      res.valid &&
        res.resolvedUrl.startsWith("https://") &&
        res.resolvedUrl === "https://mdm-building-passport.vercel.app",
      "2. Showcase URL is HTTPS (https://mdm-building-passport.vercel.app)"
    );
  }

  // 3. Production QR never contains localhost
  {
    const res = validateAndResolveQrBaseUrl("http://localhost:3000", "production");
    assert(
      !res.valid && Boolean(res.error?.includes("localhost")),
      "3. Production QR rejects localhost configuration"
    );
  }

  // 4. Production QR never contains 127.0.0.1
  {
    const res = validateAndResolveQrBaseUrl("http://127.0.0.1:5000", "production");
    assert(
      !res.valid && Boolean(res.error?.includes("127.0.0.1")),
      "4. Production QR rejects 127.0.0.1 configuration"
    );
  }

  // 5. Production QR never contains 192.168.
  {
    const res = validateAndResolveQrBaseUrl("http://192.168.1.28:5000", "production");
    assert(
      !res.valid && Boolean(res.error?.includes("192.168.")),
      "5. Production QR rejects private LAN IP (192.168.x.x)"
    );
  }

  // 6. Production QR never contains 100.70.
  {
    const res = validateAndResolveQrBaseUrl("http://100.70.45.12:3000", "production");
    assert(
      !res.valid && Boolean(res.error?.includes("100.70.")),
      "6. Production QR rejects Tailscale CGNAT IP (100.70.x.x)"
    );
  }

  // 7. Production QR never contains trycloudflare.com
  {
    const res = validateAndResolveQrBaseUrl(
      "https://lexmark-slip-melissa-practices.trycloudflare.com",
      "production"
    );
    assert(
      !res.valid && Boolean(res.error?.includes("trycloudflare.com")),
      "7. Production QR rejects Cloudflare tunnel host (trycloudflare.com)"
    );
  }

  // 8. In production/showcase with empty input, safely defaults to canonical showcase URL
  {
    const res = validateAndResolveQrBaseUrl("", "production");
    assert(
      res.valid && res.resolvedUrl === "https://mdm-building-passport.vercel.app",
      "8. Unset public URL safely defaults to canonical Vercel showcase URL in production"
    );
  }

  // 9. Rejects backend or API path in base URL
  {
    const res = validateAndResolveQrBaseUrl("https://mdm-building-passport.vercel.app/api", "production");
    assert(
      !res.valid && Boolean(res.error?.includes("API")),
      "9. QR base URL rejects accidental backend/API path inclusion"
    );
  }

  // 10. Passport ID is encoded safely
  {
    const safeUrl = QrService.getPublicUrl("BP-2025-01934");
    assert(
      safeUrl.endsWith("/public/building/BP-2025-01934"),
      "10. Standard passport ID encoded correctly in public path"
    );

    const specialUrl = QrService.getPublicUrl("BP 2026/001");
    assert(
      specialUrl.endsWith("/public/building/BP%202026%2F001"),
      "10b. Special characters in passport ID are URL-encoded safely"
    );
  }

  // 11. Deterministic QR generation
  {
    const passportId = "BP-2025-01934";
    const qr1 = await QrService.generatePassportQr(passportId);
    const qr2 = await QrService.generatePassportQr(passportId);

    assert(
      qr1.startsWith("data:image/png;base64,") && qr1 === qr2,
      "11. QR Code Data URL generation is 100% deterministic (repeated runs match bit-for-bit)"
    );

    const svg = await QrService.generatePassportQrSvg(passportId);
    assert(
      svg.includes("<svg") && svg.includes("</svg>"),
      "11b. SVG QR generation produces valid SVG markup"
    );
  }

  console.log("\n==================================================================");
  console.log(`  QR TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runQrTests().catch((err) => {
  console.error("Fatal QR test error:", err);
  process.exit(1);
});
