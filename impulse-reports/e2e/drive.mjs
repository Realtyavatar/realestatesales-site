// Drives Impulse Reports end-to-end in Chromium against the mock Supabase.
import { chromium } from "playwright";
import fs from "node:fs";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

const BASE = "http://127.0.0.1:3000";
const DIR = new URL(".", import.meta.url).pathname;
const shot = (name) => `${DIR}/shot-${name}.png`;

// --- generate a real 400x300 PNG (gradient) to exercise compression/upload
function makePng(w, h) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const cr = Buffer.alloc(4);
    cr.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, cr]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      raw[row + 1 + x * 3] = Math.floor((x / w) * 255);      // R gradient
      raw[row + 1 + x * 3 + 1] = 114;                        // G
      raw[row + 1 + x * 3 + 2] = Math.floor((y / h) * 255);  // B gradient
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const step = (msg) => console.log(`\n=== ${msg}`);

let page;
async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-proxy-server"], // don't route localhost via the env's agent proxy
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone-ish
    deviceScaleFactor: 2,
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE-ERROR:", m.text().slice(0, 200));
  });

  page.on("request", (r) => {
    if (r.url().includes("54321")) console.log("  ->", r.method(), r.url().slice(0, 90));
  });

  step("1. login page renders");
  await page.goto(BASE + "/");
  await page.waitForSelector("text=Impulse Reports");
  await page.waitForLoadState("networkidle"); // let React hydrate before typing
  await page.screenshot({ path: shot("01-login") });

  step("2. PROBE: wrong password shows error");
  await page.fill("#email", "info@impulseelectrical.com.au");
  await page.fill("#password", "wrong-password");
  await page.click("button[type=submit]");
  await page.waitForSelector("text=Invalid login credentials");
  console.log("OK: invalid credentials error shown");

  step("3. sign in");
  await page.fill("#password", "test-password-123");
  await page.click("button[type=submit]");
  await page.waitForURL("**/jobs");
  await page.waitForSelector("text=14 Sample Street");
  await page.screenshot({ path: shot("02-jobs-list") });
  console.log("OK: jobs list shows seeded example job");

  step("4. PROBE: search filters by address / no-match state");
  await page.fill("input[type=search]", "sample street");
  await page.waitForSelector("text=14 Sample Street");
  await page.fill("input[type=search]", "zzz-no-match");
  await page.waitForSelector("text=No jobs match your search.");
  await page.fill("input[type=search]", "");
  console.log("OK: search + empty state work");

  step("5. open seed job — defects register + boards");
  await page.click("text=14 Sample Street");
  await page.waitForSelector("text=Defects register");
  await page.waitForSelector("text=RCD on circuit 4 failed trip-time test");
  await page.screenshot({ path: shot("03-job-detail"), fullPage: true });
  console.log("OK: job detail with defects register");

  step("6. autosave: edit notes, wait for Saved, reload and confirm");
  await page.fill("#notes", "Autosave verification note — typed on site.");
  await page.waitForSelector("text=✓ Saved", { timeout: 15000 });
  await page.reload();
  const notesVal = await page.inputValue("#notes");
  if (!notesVal.includes("Autosave verification note")) throw new Error("autosave did not persist");
  console.log("OK: autosave persisted across reload");

  step("7. add a board, fill details, checklist, defect");
  await page.click("text=+ Add board");
  await page.waitForURL("**/boards/**");
  await page.fill("#board_name", "Unit 14");
  await page.fill("#board_location", "Unit 14 hallway");
  await page.fill("#rating_amps", "63");
  await page.fill("#fault_level", "6kA");
  // default checklist copied from settings
  await page.waitForSelector("text=RCD test");
  await page.waitForSelector("text=Connections torqued");
  // set results: first item Pass
  const passButtons = page.locator("button:has-text('Pass')");
  await passButtons.nth(0).click();
  await passButtons.nth(1).click();
  // add custom checklist item
  await page.fill("input[placeholder='Add checklist item…']", "Surge diverter fitted");
  await page.click("section:has-text('Checklist') >> button:has-text('Add')");
  await page.waitForSelector("text=Surge diverter fitted");
  // defect toggle
  await page.click("[role=switch]");
  await page.click("button:has-text('Non-compliance')");
  await page.fill("#defect_description", "No RCD protection on power circuits.");
  await page.waitForSelector("text=✓ Saved", { timeout: 15000 });
  console.log("OK: board details + custom checklist + defect saved");

  step("8. PROBE: photo upload while OFFLINE queues, then retries when back online");
  const png = makePng(400, 300);
  await context.setOffline(true);
  await page.setInputFiles("input[type=file][multiple]", {
    name: "site-photo.png", mimeType: "image/png", buffer: png,
  });
  await page.waitForSelector("text=/Uploading…|Waiting for signal/", { timeout: 15000 });
  await page.screenshot({ path: shot("04-photo-queued-offline") });
  console.log("OK: photo shown as queued while offline");
  await context.setOffline(false);
  // queue drains via online event or 20s retry timer
  await page.waitForSelector("figure img", { timeout: 45000 });
  console.log("OK: queued photo uploaded after reconnect");
  await page.fill("input[placeholder='Caption (optional)']", "Unit 14 board before works");
  await page.waitForTimeout(1500); // caption debounce
  await page.screenshot({ path: shot("05-board-with-photo"), fullPage: true });

  step("9. variation: fill, sign on canvas, lock");
  await page.goBack();
  await page.waitForSelector("text=Variations");
  await page.click("text=+ New variation");
  await page.waitForURL("**/variations/**");
  await page.fill("#description", "Supply and install surge protection to Unit 14 board.");
  await page.fill("#price", "480");
  await page.waitForSelector("text=$528.00 inc GST");
  await page.fill("#signer_name", "Jane Citizen");
  // draw a squiggle on the signature canvas
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 40, box.y + 100);
  await page.mouse.down();
  for (let i = 0; i < 12; i++) {
    await page.mouse.move(box.x + 40 + i * 20, box.y + 100 + Math.sin(i) * 30, { steps: 3 });
  }
  await page.mouse.up();
  await page.click("text=Accept & sign");
  await page.waitForSelector("text=Signed and locked", { timeout: 20000 });
  const descDisabled = await page.locator("#description").isDisabled();
  if (!descDisabled) throw new Error("signed variation fields not locked");
  await page.screenshot({ path: shot("06-variation-signed"), fullPage: true });
  console.log("OK: variation signed, timestamped, fields locked");

  step("10. PROBE: email report without RESEND config -> clear error");
  await page.goBack();
  await page.waitForSelector("text=Report");
  const jobUrl = page.url();
  const jobId = jobUrl.match(/jobs\/([0-9a-f-]+)/)[1];
  await page.fill("#email_to", "jane@example.com");
  await page.click("button:has-text('Send')");
  await page.waitForSelector("text=/Email isn't configured yet/");
  console.log("OK: unconfigured email returns clear message");

  step("11. download the PDF report");
  const resp = await page.request.get(`${BASE}/api/report/${jobId}`);
  if (resp.status() !== 200) throw new Error(`PDF status ${resp.status()}`);
  const pdf = await resp.body();
  if (pdf.slice(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
  fs.writeFileSync(`${DIR}/report.pdf`, pdf);
  console.log(`OK: PDF generated, ${pdf.length} bytes -> report.pdf`);

  step("12. PROBE: PDF for a brand-new EMPTY draft job (no boards/photos/address)");
  await page.goto(BASE + "/jobs");
  await page.click("text=+ New Job");
  await page.waitForURL(/jobs\/[0-9a-f-]+/);
  const emptyId = page.url().match(/jobs\/([0-9a-f-]+)/)[1];
  const resp2 = await page.request.get(`${BASE}/api/report/${emptyId}`);
  if (resp2.status() !== 200) throw new Error(`empty-job PDF status ${resp2.status()}`);
  const pdf2 = await resp2.body();
  if (pdf2.slice(0, 5).toString() !== "%PDF-") throw new Error("empty-job report is not a PDF");
  fs.writeFileSync(`${DIR}/report-empty.pdf`, pdf2);
  console.log("OK: empty draft job still produces a valid PDF");

  step("13. PROBE: unauthenticated access redirects to login; bogus job 404s");
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(BASE + "/jobs");
  await anonPage.waitForURL(BASE + "/");
  console.log("OK: /jobs redirects anonymous visitor to login");
  const anonPdf = await anonPage.request.get(`${BASE}/api/report/${jobId}`);
  console.log(`anon PDF request status: ${anonPdf.status()} (expect 401 or redirect-to-login 200-html)`);
  const bogus = await page.request.get(`${BASE}/api/report/00000000-0000-4000-8000-00000000dead`);
  console.log(`bogus job PDF status: ${bogus.status()} (expect 404)`);
  await anon.close();

  step("14. settings: business details autosave + default checklist");
  await page.goto(BASE + "/settings");
  await page.fill("#phone", "0412 345 678");
  await page.fill("#abn", "12 345 678 901");
  await page.waitForSelector("text=✓ Saved", { timeout: 15000 });
  await page.fill("input[placeholder='Add default item…']", "Thermal scan completed");
  await page.click("button:has-text('Add')");
  await page.waitForSelector("li:has-text('Thermal scan completed')");
  await page.waitForSelector("text=✓ Saved");
  await page.screenshot({ path: shot("07-settings"), fullPage: true });
  console.log("OK: settings autosaved");

  await browser.close();
  console.log("\nALL FLOWS PASSED");
}

main().catch(async (e) => {
  console.error("DRIVE FAILED:", e);
  try {
    await page.screenshot({ path: shot("FAIL") });
    const body = await page.textContent("body");
    console.error("PAGE TEXT:", body.replace(/\s+/g, " ").slice(0, 600));
  } catch {}
  process.exit(1);
});
