import path from "node:path";

const APPROVED_EXTERNAL_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "developers.facebook.com",
  "github.com",
]);

export function isApprovedExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && APPROVED_EXTERNAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function isTrustedRendererUrl(
  value: string,
  developmentUrl?: string,
): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "sme:" && url.hostname === "bundle") {
      return true;
    }

    if (!developmentUrl) {
      return false;
    }

    const developmentOrigin = new URL(developmentUrl).origin;
    return url.origin === developmentOrigin;
  } catch {
    return false;
  }
}

export function resolveRendererAsset(
  rendererRoot: string,
  requestUrl: string,
): { absolutePath: string; pathname: string } | null {
  try {
    const url = new URL(requestUrl);
    if (url.protocol !== "sme:" || url.hostname !== "bundle") {
      return null;
    }

    const pathname = decodeURIComponent(url.pathname);
    const absolutePath = path.resolve(rendererRoot, `.${pathname}`);
    const relativePath = path.relative(rendererRoot, absolutePath);
    const isSafe =
      relativePath === "" ||
      (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));

    return isSafe ? { absolutePath, pathname } : null;
  } catch {
    return null;
  }
}

export function canUseSpaFallback(pathname: string): boolean {
  return path.extname(pathname) === "";
}
