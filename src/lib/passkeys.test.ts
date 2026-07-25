import { describe, expect, it } from "vitest";
import { decodeCreationOptions, decodeRequestOptions, isPasskeySupported } from "./passkeys";

function bytes(value: BufferSource): number[] {
  const view = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return Array.from(view);
}

describe("passkey option conversion", () => {
  it("decodes creation challenge, user and excluded credential ids", () => {
    const decoded = decodeCreationOptions({
      challenge: "AQID" as unknown as BufferSource,
      rp: { name: "Sales", id: "localhost" },
      user: {
        id: "BAUG" as unknown as BufferSource,
        name: "user@example.com",
        displayName: "User",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      excludeCredentials: [{ type: "public-key", id: "BwgJ" as unknown as BufferSource }],
    });

    expect(bytes(decoded.challenge)).toEqual([1, 2, 3]);
    expect(bytes(decoded.user.id)).toEqual([4, 5, 6]);
    expect(bytes(decoded.excludeCredentials![0].id)).toEqual([7, 8, 9]);
  });

  it("decodes authentication challenge and allowed credential ids", () => {
    const decoded = decodeRequestOptions({
      challenge: "AQID" as unknown as BufferSource,
      allowCredentials: [{ type: "public-key", id: "BAUG" as unknown as BufferSource }],
    });

    expect(bytes(decoded.challenge)).toEqual([1, 2, 3]);
    expect(bytes(decoded.allowCredentials![0].id)).toEqual([4, 5, 6]);
  });

  it("reports WebAuthn as unavailable in the test environment", () => {
    expect(isPasskeySupported()).toBe(false);
  });
});
