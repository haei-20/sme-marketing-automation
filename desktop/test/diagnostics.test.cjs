const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  configureDiagnostics,
  readRecentDiagnostics,
  redactDiagnosticText,
  writeDiagnostic,
} = require("../dist/diagnostics.js");

test("lọc credential và dữ liệu nhận dạng khỏi diagnostics", () => {
  const source = [
    "Authorization: Bearer abc.def.ghi",
    "password=hunter2",
    "api_key=sk-example",
    "secret:top-secret",
    "contact owner@example.com",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
  ].join("; ");
  const redacted = redactDiagnosticText(source);

  for (const sensitive of ["abc.def.ghi", "hunter2", "sk-example", "top-secret", "owner@example.com", "eyJhbGci"]) {
    assert.equal(redacted.includes(sensitive), false);
  }
  assert.match(redacted, /REDACTED/);
});

test("ghi và đọc log JSONL đã redact trong thư mục local", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sme-diagnostics-"));
  context.after(async () => fs.rm(directory, { recursive: true, force: true }));
  configureDiagnostics(directory);

  await writeDiagnostic("WARN", "auth_test", "token=private-token; user@example.com");
  const logs = await readRecentDiagnostics();

  assert.equal(logs.length, 1);
  assert.equal(logs[0].event, "auth_test");
  assert.equal(logs[0].message.includes("private-token"), false);
  assert.equal(logs[0].message.includes("user@example.com"), false);
  assert.match(logs[0].message, /REDACTED/);
});
