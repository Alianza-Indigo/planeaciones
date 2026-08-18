import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    teacherProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { POST } from "@/app/api/teacher/profile/route";

const validBody = { nombre: "Diana R.", escuela: "Primaria Juárez", nivel: "Primaria", grado: "3°" };

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/teacher/profile", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: { id: "u1" } });
  prismaMock.teacherProfile.create.mockImplementation(({ data }) => ({ editCount: 0, ...data }));
  prismaMock.teacherProfile.update.mockImplementation(({ data }) => ({
    ...validBody,
    editCount: typeof data.editCount === "object" ? 1 : data.editCount,
  }));
});

describe("POST /api/teacher/profile", () => {
  it("rechaza sin sesión con 401", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await call(validBody);
    expect(res.status).toBe(401);
  });

  it("rechaza datos inválidos (grado fuera del nivel) con 400", async () => {
    const res = await call({ ...validBody, nivel: "Preescolar", grado: "6°" });
    expect(res.status).toBe(400);
    expect(prismaMock.teacherProfile.create).not.toHaveBeenCalled();
  });

  it("da de alta sin consumir cambios (editCount 0)", async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ remainingEdits: 2 });
    expect(prismaMock.teacherProfile.create).toHaveBeenCalled();
    expect(prismaMock.teacherProfile.update).not.toHaveBeenCalled();
  });

  it("una modificación consume un cambio (increment)", async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ ...validBody, editCount: 0 });
    const res = await call({ ...validBody, escuela: "Otra Primaria" });
    expect(res.status).toBe(200);
    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ editCount: { increment: 1 } }) }),
    );
  });

  it("bloquea con 403 al agotar los cambios", async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ ...validBody, editCount: 2 });
    const res = await call({ ...validBody, escuela: "Tercer intento" });
    expect(res.status).toBe(403);
    expect(prismaMock.teacherProfile.update).not.toHaveBeenCalled();
  });
});
