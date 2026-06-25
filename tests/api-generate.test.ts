import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn(), upsert: vi.fn() },
    generation: { create: vi.fn(), update: vi.fn() },
    promptTemplate: { findFirst: vi.fn() },
  },
}));
const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));
const { createDraftMock } = vi.hoisted(() => ({ createDraftMock: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/alianza-indigo/generate-planning", () => ({
  generatePlanningWithAlianzaIndigo: generateMock,
}));
vi.mock("@/lib/drafts/create-draft", () => ({ createTemporaryDraft: createDraftMock }));

import { POST } from "@/app/api/generate/route";

const validBody = {
  nombreDocente: "Diana",
  nombreEscuela: "Escuela",
  periodoPlaneado: "Semana 1",
  grado: "3 primaria",
  fase: "Fase 4",
  duracion: 50,
  sesiones: 5,
  proyecto: "Proyecto",
  campos: ["LENGUAJES"],
  contenidos: ["Escritura de nombres."],
  pda: ["Escribe su nombre."],
};

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { id: "u1" } });
  prismaMock.promptTemplate.findFirst.mockResolvedValue(null);
  prismaMock.generation.create.mockResolvedValue({ id: "g1" });
  prismaMock.generation.update.mockResolvedValue({});
  prismaMock.membership.upsert.mockResolvedValue({});
  generateMock.mockResolvedValue({
    title: "Plan",
    content: "Contenido generado",
    providerRequestId: "r1",
    model: "m",
    tokensIn: 1,
    tokensOut: 2,
  });
  createDraftMock.mockResolvedValue({ id: "d1", title: "Plan", expiresAt: new Date("2030-01-01") });
});

describe("POST /api/generate", () => {
  it("rechaza sin sesión con 401", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await call(validBody);
    expect(res.status).toBe(401);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rechaza un body inválido con 400", async () => {
    const res = await call({ nombreDocente: "x" });
    expect(res.status).toBe(400);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("bloquea con 403 al usuario FREE que alcanzó su límite (no llama al LLM)", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      status: "FREE",
      generationsUsed: 100,
      generationLimit: 100,
    });
    const res = await call(validBody);
    expect(res.status).toBe(403);
    expect(generateMock).not.toHaveBeenCalled();
    expect(prismaMock.generation.create).not.toHaveBeenCalled();
  });

  it("permite generar al usuario FREE bajo el límite e incrementa el uso", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      status: "FREE",
      generationsUsed: 1,
      generationLimit: 3,
    });
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ draftId: "d1" });
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.membership.upsert).toHaveBeenCalledTimes(1);
  });

  it("permite generar sin tope al miembro ACTIVE aunque supere el límite", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      status: "ACTIVE",
      generationsUsed: 999,
      generationLimit: 3,
    });
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it("permite generar cuando no existe membresía aún", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it("devuelve 502 si la generación falla y marca la generación como FAILED", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    generateMock.mockRejectedValue(new Error("LLM caído"));
    const res = await call(validBody);
    expect(res.status).toBe(502);
    expect(prismaMock.generation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );
  });
});
