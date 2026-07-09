// Minimal in-memory mock of the Supabase HTTP surface (GoTrue + PostgREST +
// Storage) — just enough to drive Impulse Reports end-to-end for verification.
import http from "node:http";
import crypto from "node:crypto";

const PORT = 54321;
const USER = { email: "info@impulseelectrical.com.au", password: "test-password-123" };

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
const ACCESS_TOKEN = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
  sub: "00000000-0000-4000-8000-000000000001",
  role: "authenticated",
  email: USER.email,
  exp: Math.floor(Date.now() / 1000) + 86400,
})}.${b64url({ sig: "fake" })}`;

const userObj = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: USER.email,
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------- tables
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

const defaults = {
  jobs: () => ({
    id: uuid(), client_name: "", client_phone: "", client_email: "",
    site_address: "", job_type: "general", job_date: now().slice(0, 10),
    notes: "", recommendations: "", status: "draft",
    created_at: now(), updated_at: now(),
  }),
  boards: () => ({
    id: uuid(), job_id: null, name: "", location: "", rating_amps: "",
    fault_level: "", earth_location: "", checklist: [], has_defects: false,
    defect_description: "", defect_severity: null, sort_order: 0,
    created_at: now(), updated_at: now(),
  }),
  photos: () => ({
    id: uuid(), job_id: null, board_id: null, storage_path: "", caption: "",
    sort_order: 0, created_at: now(),
  }),
  variations: () => ({
    id: uuid(), job_id: null, description: "", pricing_mode: "fixed",
    price_ex_gst: null, hourly_rate_ex_gst: null,
    variation_date: now().slice(0, 10), signer_name: "", signed_at: null,
    signature_path: null, created_at: now(), updated_at: now(),
  }),
  settings: () => ({
    id: true, business_name: "Impulse Electrical Contractors",
    rec_number: "REC 25266", abn: "", phone: "", email: "", address: "",
    logo_path: null,
    default_checklist: [
      { label: "RCD test" },
      { label: "Connections torqued" },
      { label: "Labelling compliant" },
    ],
    updated_at: now(),
  }),
  quotes: () => ({
    id: uuid(), job_id: null, quote_number: "",
    quote_date: now().slice(0, 10), expiry_date: null,
    status: "draft", items: [], notes: "",
    terms: "Payment due within 14 days of acceptance. Quoted prices are exclusive of GST unless stated. Quote valid for 30 days from issue date.",
    created_at: now(), updated_at: now(),
  }),
};

const db = { jobs: [], boards: [], photos: [], variations: [], quotes: [], settings: [defaults.settings()] };

// Seed (mirrors 0002_seed_example_job.sql)
const seedJob = {
  ...defaults.jobs(),
  client_name: "Example Client — Jane Citizen",
  client_phone: "0400 000 000",
  client_email: "jane@example.com",
  site_address: "14 Sample Street, Melbourne VIC 3000",
  job_type: "safety_check",
  notes: "EXAMPLE JOB — created automatically so you can see how Impulse Reports works.",
  recommendations: "Replace the aged RCD on the main switchboard within 30 days.",
  status: "in_progress",
};
db.jobs.push(seedJob);
db.boards.push({
  ...defaults.boards(), job_id: seedJob.id, name: "MSB",
  location: "Ground floor switch room", rating_amps: "250", fault_level: "10kA",
  checklist: [
    { id: "c1", label: "RCD test", result: "fail" },
    { id: "c2", label: "Connections torqued", result: "pass" },
    { id: "c3", label: "Labelling compliant", result: "pass" },
  ],
  has_defects: true,
  defect_description: "RCD on circuit 4 failed trip-time test (>300ms). Requires replacement.",
  defect_severity: "safety",
});
db.boards.push({
  ...defaults.boards(), job_id: seedJob.id, name: "GMB-1",
  location: "Level 1 riser cupboard", rating_amps: "100", fault_level: "6kA",
  checklist: [
    { id: "c1", label: "RCD test", result: "pass" },
    { id: "c2", label: "Connections torqued", result: "pass" },
    { id: "c3", label: "Labelling compliant", result: "na" },
  ],
  sort_order: 1,
});

// ---------------------------------------------------------------- storage
const objects = new Map(); // "bucket/path" -> { bytes, contentType }

// ---------------------------------------------------------------- helpers
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function json(res, code, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    ...headers,
  });
  res.end(body);
}

function applyFilters(rows, params) {
  let out = rows;
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(key)) continue;
    if (value.startsWith("eq.")) {
      const v = value.slice(3);
      out = out.filter((r) => String(r[key]) === v);
    }
  }
  const order = params.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    out = [...out].sort((a, b) =>
      (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === "desc" ? -1 : 1)
    );
  }
  const limit = params.get("limit");
  if (limit) out = out.slice(0, Number(limit));
  return out;
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------------------------------------------------------------- server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    });
    return res.end();
  }

  // ----- auth
  if (path === "/auth/v1/token" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)).toString() || "{}");
    if (body.email === USER.email && body.password === USER.password) {
      log("AUTH ok", body.email);
      return json(res, 200, {
        access_token: ACCESS_TOKEN,
        token_type: "bearer",
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: "fake-refresh-token",
        user: userObj,
      });
    }
    log("AUTH fail", body.email);
    return json(res, 400, {
      error: "invalid_grant",
      error_description: "Invalid login credentials",
      error_code: "invalid_credentials",
      code: 400, msg: "Invalid login credentials",
    });
  }
  if (path === "/auth/v1/user" && req.method === "GET") {
    const auth = req.headers.authorization || "";
    if (auth === `Bearer ${ACCESS_TOKEN}`) return json(res, 200, userObj);
    return json(res, 401, { code: 401, msg: "invalid JWT" });
  }
  if (path === "/auth/v1/logout") return json(res, 204, {});

  // ----- storage
  if (path.startsWith("/storage/v1/")) {
    const rest = path.slice("/storage/v1/".length);
    // signed url creation (bulk): POST /object/sign/{bucket}
    let m = rest.match(/^object\/sign\/([^/]+)$/);
    if (m && req.method === "POST") {
      const bucket = m[1];
      const body = JSON.parse((await readBody(req)).toString());
      return json(res, 200, body.paths.map((p) => ({
        error: null, path: p,
        signedURL: `/object/sign/${bucket}/${p}?token=fake`,
      })));
    }
    // signed url creation (single): POST /object/sign/{bucket}/{path}
    m = rest.match(/^object\/sign\/([^/]+)\/(.+)$/);
    if (m && req.method === "POST") {
      return json(res, 200, { signedURL: `/object/sign/${m[1]}/${m[2]}?token=fake` });
    }
    // signed url fetch: GET /object/sign/{bucket}/{path}
    if (m && req.method === "GET") {
      const obj = objects.get(`${m[1]}/${m[2]}`);
      if (!obj) return json(res, 404, { error: "not found" });
      res.writeHead(200, { "content-type": obj.contentType, "access-control-allow-origin": "*" });
      return res.end(obj.bytes);
    }
    // upload / download / delete: /object/{bucket}/{path} or DELETE /object/{bucket}
    m = rest.match(/^object\/([^/]+)(?:\/(.+))?$/);
    if (m) {
      const bucket = m[1];
      const key = m[2] ? `${bucket}/${m[2]}` : null;
      if (req.method === "POST" || req.method === "PUT") {
        let bytes = await readBody(req);
        let contentType = req.headers["content-type"] || "application/octet-stream";
        // Browser uploads arrive as multipart/form-data — extract the file
        // part like real Supabase storage does.
        if (contentType.startsWith("multipart/form-data")) {
          const fd = await new Request("http://x", {
            method: "POST",
            headers: { "content-type": contentType },
            body: bytes,
          }).formData();
          for (const [, v] of fd.entries()) {
            if (typeof v === "object" && v && "arrayBuffer" in v) {
              bytes = Buffer.from(await v.arrayBuffer());
              contentType = v.type || "application/octet-stream";
              break;
            }
          }
        }
        objects.set(key, { bytes, contentType });
        log("STORAGE upload", key, bytes.length, "bytes", contentType);
        return json(res, 200, { Id: uuid(), Key: key });
      }
      if (req.method === "GET") {
        const obj = objects.get(key);
        log("STORAGE download", key, obj ? `${obj.bytes.length} bytes` : "MISS");
        if (!obj) return json(res, 404, { error: "not found" });
        res.writeHead(200, { "content-type": obj.contentType });
        return res.end(obj.bytes);
      }
      if (req.method === "DELETE") {
        if (key) { objects.delete(key); return json(res, 200, []); }
        const body = JSON.parse((await readBody(req)).toString());
        for (const p of body.prefixes ?? []) objects.delete(`${bucket}/${p}`);
        log("STORAGE delete", bucket, body.prefixes);
        return json(res, 200, (body.prefixes ?? []).map((p) => ({ name: p })));
      }
    }
    return json(res, 404, { error: `unhandled storage ${req.method} ${path}` });
  }

  // ----- postgrest
  if (path.startsWith("/rest/v1/")) {
    const table = path.slice("/rest/v1/".length);
    if (!(table in db)) return json(res, 404, { message: `table ${table} not found` });
    const rows = db[table];
    const params = url.searchParams;
    const prefer = req.headers.prefer || "";
    const accept = req.headers.accept || "";
    const wantsObject = accept.includes("vnd.pgrst.object");

    const respond = (data, code = 200) => {
      if (wantsObject) {
        if (data.length === 0)
          return json(res, 406, {
            code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned",
            details: "0 rows", hint: null,
          });
        return json(res, code, data[0]);
      }
      return json(res, code, data);
    };

    if (req.method === "GET") {
      log("REST GET", table, url.search);
      return respond(applyFilters(rows, params));
    }

    if (req.method === "POST") {
      const body = JSON.parse((await readBody(req)).toString() || "{}");
      const items = Array.isArray(body) ? body : [body];
      const isUpsert = prefer.includes("resolution=merge-duplicates") || params.get("on_conflict");
      const created = [];
      for (const item of items) {
        const conflictKey = params.get("on_conflict") || "id";
        const existing = isUpsert
          ? rows.find((r) => item[conflictKey] !== undefined && String(r[conflictKey]) === String(item[conflictKey]))
          : undefined;
        if (existing) {
          Object.assign(existing, item, { updated_at: now() });
          created.push(existing);
        } else {
          const row = { ...defaults[table](), ...item };
          rows.push(row);
          created.push(row);
        }
      }
      log("REST INSERT", table, JSON.stringify(items).slice(0, 120));
      if (prefer.includes("return=representation")) return respond(created, 201);
      res.writeHead(201, { "access-control-allow-origin": "*" });
      return res.end();
    }

    if (req.method === "PATCH") {
      const body = JSON.parse((await readBody(req)).toString() || "{}");
      const matched = applyFilters(rows, params);
      for (const row of matched) Object.assign(row, body, { updated_at: now() });
      log("REST UPDATE", table, url.search, JSON.stringify(body).slice(0, 160));
      if (prefer.includes("return=representation")) return respond(matched);
      res.writeHead(204, { "access-control-allow-origin": "*" });
      return res.end();
    }

    if (req.method === "DELETE") {
      const matched = applyFilters(rows, params);
      db[table] = rows.filter((r) => !matched.includes(r));
      // cascade like the FK constraints
      if (table === "jobs") {
        for (const j of matched) {
          db.boards = db.boards.filter((b) => b.job_id !== j.id);
          db.photos = db.photos.filter((p) => p.job_id !== j.id);
          db.variations = db.variations.filter((v) => v.job_id !== j.id);
          db.quotes = db.quotes.filter((q) => q.job_id !== j.id);
        }
      }
      if (table === "boards") {
        for (const b of matched) db.photos = db.photos.filter((p) => p.board_id !== b.id);
      }
      log("REST DELETE", table, url.search, `${matched.length} rows`);
      res.writeHead(204, { "access-control-allow-origin": "*" });
      return res.end();
    }
  }

  log("UNHANDLED", req.method, path);
  return json(res, 404, { error: `unhandled ${req.method} ${path}` });
});

server.listen(PORT, () => log(`mock supabase on :${PORT}`));
