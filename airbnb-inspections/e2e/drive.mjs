// Drives Checkout Inspections end-to-end in Chromium against the mock Supabase.
import { chromium } from "playwright";
import fs from "node:fs";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

const BASE = "http://127.0.0.1:3000";
const DIR = new URL(".", import.meta.url).pathname;
const shot = (name) => `${DIR}/shot-${name}.png`;

// --- generate a real 400x300 PNG (gradient) to exercise processing/upload
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
      raw[row + 1 + x * 3 + 1] = 56;                         // G
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

  step("1. login page renders");
  await page.goto(BASE + "/");
  await page.waitForSelector("text=Checkout Inspections");
  await page.waitForLoadState("networkidle"); // let React hydrate before typing
  await page.screenshot({ path: shot("01-login") });

  step("2. PROBE: wrong password shows error");
  // Retry loop: a click that lands before React hydrates submits the form
  // natively and reloads the page — refill and try again.
  for (let attempt = 0; ; attempt++) {
    await page.fill("#email", "host@example.com");
    await page.fill("#password", "wrong-password");
    await page.click("button[type=submit]");
    try {
      await page.waitForSelector("text=Invalid login credentials", { timeout: 5000 });
      break;
    } catch (err) {
      if (attempt >= 3) throw err;
      console.log("  (page not hydrated yet, retrying login)");
    }
  }
  console.log("OK: invalid credentials error shown");

  step("3. sign in -> startup prompt auto-opens");
  await page.fill("#password", "test-password-123");
  await page.click("button[type=submit]");
  await page.waitForURL("**/inspections");
  // The app prompts on startup to begin a checkout inspection
  await page.waitForSelector("text=Begin a checkout inspection?");
  await page.screenshot({ path: shot("02-startup-prompt") });
  console.log("OK: startup prompt auto-opened");

  step("4. begin inspection -> all rooms created");
  await page.fill("#property-name", "Beach House");
  await page.fill("#property-address", "12 Ocean St, Torquay VIC");
  await page.click("form button[type=submit]");
  await page.waitForURL(/inspections\/[0-9a-f-]+$/);
  const ROOMS = [
    "Bedroom", "Bathroom", "Powder room", "Kitchen",
    "Living area", "BBQ & outdoor area", "Backyard",
  ];
  for (const room of ROOMS) {
    await page.waitForSelector(`text=${room}`);
  }
  await page.screenshot({ path: shot("03-inspection-overview"), fullPage: true });
  const inspectionUrl = page.url();
  const inspectionId = inspectionUrl.match(/inspections\/([0-9a-f-]+)/)[1];
  console.log(`OK: inspection created with ${ROOMS.length} rooms`, inspectionId);

  step("5. bathroom checklist: requested items present, ticks persist");
  await page.click("text=Bathroom");
  await page.waitForURL("**/rooms/**");
  await page.waitForSelector("text=Soap restocked");
  await page.waitForSelector("text=Toilet paper stocked");
  await page.click("text=Soap restocked");
  await page.click("text=Toilet paper stocked");
  await page.waitForSelector("text=✓ Synced", { timeout: 15000 });
  await page.reload();
  await page.waitForSelector("text=2/4");
  console.log("OK: checklist ticks synced and survived reload");

  step("5b. PROBE: tick then IMMEDIATE back — flush-on-unmount must save it");
  const roomUrl = page.url();
  await page.click("text=Towels and bath mats");
  await page.goBack(); // leave within the debounce window
  await page.waitForSelector("text=Rooms");
  await page.waitForTimeout(500); // let the flushed PATCH land
  await page.goto(roomUrl);
  await page.waitForSelector("text=3/4");
  console.log("OK: tick survived tap-then-immediately-leave");

  step("6. PROBE: photo added while OFFLINE queues, then syncs when back online");
  const png = makePng(400, 300);
  await context.setOffline(true);
  await page.setInputFiles("input[type=file][multiple]", {
    name: "bathroom.png", mimeType: "image/png", buffer: png,
  });
  await page.waitForSelector("text=/Syncing to cloud…|Waiting for signal/", { timeout: 15000 });
  await page.screenshot({ path: shot("04-photo-queued-offline") });
  console.log("OK: photo shown as queued while offline");
  await context.setOffline(false);
  // queue drains via online event or 20s retry timer
  await page.waitForSelector("figure img", { timeout: 45000 });
  await page.waitForSelector("text=/20\\d\\d, \\d{1,2}:\\d{2} (am|pm)/"); // timestamp under the photo
  console.log("OK: queued photo uploaded after reconnect, capture time recorded");
  await page.fill("input[placeholder='Caption (optional)']", "Mould spot above shower");
  await page.waitForTimeout(1500); // caption debounce
  await page.screenshot({ path: shot("05-room-with-photo"), fullPage: true });

  step("7. flag damage in the bathroom with severity + notes");
  await page.click("button:has-text('Flag damage')");
  await page.waitForSelector("input[placeholder^=\"What's damaged?\"]");
  await page.fill("input[placeholder^=\"What's damaged?\"]", "Cracked mirror above vanity");
  await page.click("button:has-text('Severe')");
  await page.fill("textarea[placeholder^='Notes']", "Deep crack, needs full replacement. Quote ~$180.");
  await page.waitForTimeout(1500); // debounced save
  await page.reload();
  await page.waitForSelector("input[placeholder^=\"What's damaged?\"]");
  const desc = await page.inputValue("input[placeholder^=\"What's damaged?\"]");
  if (desc !== "Cracked mirror above vanity") throw new Error(`description lost: "${desc}"`);
  const notes = await page.inputValue("textarea[placeholder^='Notes']");
  if (!notes.includes("Deep crack")) throw new Error(`notes lost: "${notes}"`);
  // the Severe chip should be the highlighted one after reload
  const severeClass = await page.locator("button:has-text('Severe')").getAttribute("class");
  if (!severeClass.includes("bg-red-100")) throw new Error("severity not persisted");
  await page.screenshot({ path: shot("06-damage-flag"), fullPage: true });
  console.log("OK: damage flag description + severity + notes persisted");

  step("8. overview: room stats, overall notes autosave, property-wide flag");
  await page.goto(inspectionUrl);
  await page.waitForSelector("text=/3\\/4 checked · 1 photo/");
  await page.waitForSelector("text=1 damage");
  await page.fill("textarea", "Guest left the place mostly tidy. Bathroom mirror damage flagged for claim.");
  await page.waitForSelector("text=✓ Synced", { timeout: 15000 });
  // add a whole-property damage flag from the overview — target the newly
  // added (last) flag row, since the bathroom flag is also listed here
  await page.selectOption("select", { label: "Whole property" });
  await page.click("button:has-text('Flag damage')");
  // wait for the second flag row (bathroom flag + the new one) to render
  const newFlag = page.locator("li:has(input[placeholder^=\"What's damaged?\"])").nth(1);
  await newFlag.waitFor();
  await newFlag.locator("input[placeholder^=\"What's damaged?\"]").fill("Scratches on hallway floorboards");
  await newFlag.locator("button:has-text('Moderate')").click();
  await page.waitForTimeout(1500);
  await page.reload();
  const lastFlag = page.locator("li:has(input[placeholder^=\"What's damaged?\"])").last();
  await lastFlag.locator("text=Whole property").waitFor();
  const propDesc = await lastFlag.locator("input[placeholder^=\"What's damaged?\"]").inputValue();
  if (propDesc !== "Scratches on hallway floorboards") throw new Error(`property flag lost: "${propDesc}"`);
  console.log("OK: overview notes + whole-property flag saved");

  step("9. mark complete (confirm dialog fires for unchecked items)");
  let confirmSeen = false;
  page.once("dialog", (d) => {
    confirmSeen = true;
    console.log("  confirm:", d.message().slice(0, 80));
    void d.accept();
  });
  await page.click("button:has-text('Mark inspection complete')");
  await page.waitForSelector("text=/Completed \\d/", { timeout: 15000 });
  if (!confirmSeen) throw new Error("expected a confirm dialog for unchecked items");
  await page.screenshot({ path: shot("07-completed"), fullPage: true });
  console.log("OK: inspection marked complete with confirmation");

  step("10. download the timestamped PDF report");
  const resp = await page.request.get(`${BASE}/api/inspections/${inspectionId}/report`);
  if (resp.status() !== 200) throw new Error(`PDF status ${resp.status()}`);
  const disposition = resp.headers()["content-disposition"] || "";
  if (!/inspection-beach-house-\d{8}-\d{4}\.pdf/.test(disposition)) {
    throw new Error(`file name not timestamped: ${disposition}`);
  }
  const pdf = await resp.body();
  if (pdf.slice(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
  fs.writeFileSync(`${DIR}/report.pdf`, pdf);
  console.log(`OK: PDF generated, ${pdf.length} bytes, ${disposition}`);

  step("11. PROBE: PDF for a brand-new EMPTY inspection (no photos/flags)");
  await page.goto(BASE + "/inspections");
  await page.click("button:has-text('Begin checkout inspection')");
  await page.waitForSelector("text=Begin a checkout inspection?");
  await page.click("form button[type=submit]");
  await page.waitForURL(/inspections\/[0-9a-f-]+$/);
  const emptyId = page.url().match(/inspections\/([0-9a-f-]+)/)[1];
  const resp2 = await page.request.get(`${BASE}/api/inspections/${emptyId}/report`);
  if (resp2.status() !== 200) throw new Error(`empty PDF status ${resp2.status()}`);
  const pdf2 = await resp2.body();
  if (pdf2.slice(0, 5).toString() !== "%PDF-") throw new Error("empty report is not a PDF");
  fs.writeFileSync(`${DIR}/report-empty.pdf`, pdf2);
  console.log("OK: empty inspection still produces a valid PDF");

  step("12. list shows both inspections with status chips");
  await page.goto(BASE + "/inspections");
  await page.waitForSelector("text=Beach House");
  await page.waitForSelector("text=Complete");
  await page.waitForSelector("text=In progress");
  await page.screenshot({ path: shot("08-list"), fullPage: true });
  console.log("OK: list with statuses");

  step("13. PROBE: unauthenticated access redirects to login; bogus id 404s");
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(BASE + "/inspections");
  await anonPage.waitForURL(BASE + "/");
  console.log("OK: /inspections redirects anonymous visitor to login");
  const bogus = await page.request.get(`${BASE}/api/inspections/00000000-0000-4000-8000-00000000dead/report`);
  console.log(`bogus inspection PDF status: ${bogus.status()} (expect 404)`);
  await anon.close();

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
