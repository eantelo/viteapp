// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { persistAuthState } from "./apiClient";
import { downloadShippingLabels } from "./salesApi";

describe("downloadShippingLabels", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:shipping-labels"), configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("usa la sesión y el contrato HTTP compartido para descargar el PDF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("%PDF-test%", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    persistAuthState({ token: "jwt-test" });

    await downloadShippingLabels(["sale-1"]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/Sales/shipping-labels"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ saleIds: ["sale-1"] }),
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test",
          "X-Sales-Client": "Browser",
        }),
      }),
    );
  });
});
