// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, type ApiError, clearAuthState, persistAuthState } from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserva detail y traceId de ProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: "Solicitud inválida",
      detail: "El tenant no coincide con el token.",
      status: 400,
      traceId: "trace-test-1",
    }), {
      status: 400,
      headers: { "Content-Type": "application/problem+json" },
    })));

    const error = await apiClient("/api/test").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) throw new Error("Se esperaba un ApiError.");
    const apiError = error as ApiError;
    expect(apiError.message).toBe("El tenant no coincide con el token.");
    expect(apiError.status).toBe(400);
    expect(apiError.traceId).toBe("trace-test-1");
  });

  it("usa el primer error de validación cuando no existe detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: "Validation failed",
      errors: { email: ["El correo es obligatorio."] },
    }), { status: 422 })));

    await expect(apiClient("/api/test")).rejects.toThrow("El correo es obligatorio.");
  });

  it("agrega el JWT almacenado y permite limpiar la sesión", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    persistAuthState({ token: "jwt-test" });

    await apiClient("/api/test");

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toMatchObject({ Authorization: "Bearer jwt-test" });
    clearAuthState();
    expect(localStorage.getItem("salesnet.auth")).toBeNull();
  });
});
