const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
  canUseSpaFallback,
  isApprovedExternalUrl,
  isTrustedRendererUrl,
  resolveRendererAsset,
} = require("../dist/security.js");

test("chỉ cho phép renderer nội bộ hoặc đúng dev origin", () => {
  assert.equal(isTrustedRendererUrl("sme://bundle/dashboard"), true);
  assert.equal(
    isTrustedRendererUrl(
      "http://127.0.0.1:5173/dashboard",
      "http://127.0.0.1:5173",
    ),
    true,
  );
  assert.equal(
    isTrustedRendererUrl(
      "http://192.168.1.3:5173/dashboard",
      "http://127.0.0.1:5173",
    ),
    false,
  );
  assert.equal(isTrustedRendererUrl("https://example.com"), false);
});

test("external URL bắt buộc HTTPS và thuộc allowlist", () => {
  assert.equal(isApprovedExternalUrl("https://github.com/haei-20"), true);
  assert.equal(isApprovedExternalUrl("https://developers.facebook.com"), true);
  assert.equal(isApprovedExternalUrl("https://ollama.com/download/windows"), true);
  assert.equal(isApprovedExternalUrl("https://dev.mysql.com/downloads/installer/"), true);
  assert.equal(isApprovedExternalUrl("http://github.com/haei-20"), false);
  assert.equal(isApprovedExternalUrl("https://github.com.evil.test"), false);
  assert.equal(isApprovedExternalUrl("javascript:alert(1)"), false);
});

test("custom protocol không thoát khỏi renderer root", () => {
  const root = path.resolve("C:/app/renderer");
  const asset = resolveRendererAsset(root, "sme://bundle/assets/index.js");
  assert.equal(asset?.absolutePath, path.join(root, "assets/index.js"));
  assert.equal(resolveRendererAsset(root, "https://example.com/index.js"), null);
  assert.equal(
    resolveRendererAsset(root, "sme://other/assets/index.js"),
    null,
  );
});

test("SPA fallback không áp dụng cho asset có extension", () => {
  assert.equal(canUseSpaFallback("/dashboard"), true);
  assert.equal(canUseSpaFallback("/posts/12/edit"), true);
  assert.equal(canUseSpaFallback("/assets/index.js"), false);
  assert.equal(canUseSpaFallback("/favicon.svg"), false);
});
