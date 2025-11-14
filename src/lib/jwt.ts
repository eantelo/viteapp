const BASE64_PADDING = "=";

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(
    normalized.length + paddingNeeded,
    BASE64_PADDING
  );
  return atob(padded);
}

function parseTokenPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadSegment = parts[1];
    const json = decodeBase64Url(payloadSegment);
    return JSON.parse(json) as Record<string, unknown>;
  } catch (error) {
    console.warn("Unable to decode JWT payload", error);
    return null;
  }
}

export function getTokenExpiration(token: string): number | null {
  const payload = parseTokenPayload(token);
  if (!payload) {
    return null;
  }

  const exp = payload["exp"];
  if (typeof exp === "number" && Number.isFinite(exp)) {
    return exp * 1000;
  }

  return null;
}

export function isTokenExpired(token: string, marginMs = 0): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return false;
  }
  return Date.now() >= expiration - marginMs;
}
