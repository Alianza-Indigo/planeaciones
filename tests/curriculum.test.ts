import { describe, expect, it } from "vitest";

import {
  getCamposFormativos,
  getContenidosByGradoAndCampo,
  getGrados,
  getPDAByContenido,
} from "@/lib/curriculum";

describe("getGrados", () => {
  it("devuelve los grados 1 a 6 del catálogo", () => {
    expect(getGrados()).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
});

describe("getCamposFormativos", () => {
  it("incluye los 4 campos formativos NEM de un grado", () => {
    const campos = getCamposFormativos("3 primaria");
    expect(campos).toContain("LENGUAJES");
    expect(campos).toContain("SABERES Y PENSAMIENTO CIENTÍFICO");
    expect(campos).toContain("ÉTICA, NATURALEZA Y SOCIEDADES");
    expect(campos).toContain("DE LO HUMANO Y LO COMUNITARIO");
  });

  it("normaliza la etiqueta de grado ('2 primaria' === '2')", () => {
    expect(getCamposFormativos("2 primaria")).toEqual(getCamposFormativos("2"));
  });

  it("sin argumento devuelve la unión de todos los grados sin duplicados", () => {
    const todos = getCamposFormativos();
    expect(new Set(todos).size).toBe(todos.length);
    expect(todos.length).toBeGreaterThanOrEqual(getCamposFormativos("4 primaria").length);
  });

  it("devuelve [] para un grado inexistente", () => {
    expect(getCamposFormativos("9 primaria")).toEqual([]);
  });
});

describe("getContenidosByGradoAndCampo", () => {
  it("devuelve contenidos con id, titulo y pda", () => {
    const contenidos = getContenidosByGradoAndCampo("1 primaria", "LENGUAJES");
    expect(contenidos.length).toBeGreaterThan(0);

    const [primero] = contenidos;
    expect(primero.id).toBe(primero.titulo);
    expect(typeof primero.titulo).toBe("string");
    expect(Array.isArray(primero.pda)).toBe(true);
    expect(primero.pda.length).toBeGreaterThan(0);
  });

  it("devuelve [] para un campo inexistente", () => {
    expect(getContenidosByGradoAndCampo("1 primaria", "NO_EXISTE")).toEqual([]);
  });
});

describe("getPDAByContenido", () => {
  it("recupera los PDA del contenido por su texto (id)", () => {
    const [contenido] = getContenidosByGradoAndCampo("1 primaria", "LENGUAJES");
    expect(getPDAByContenido(contenido.id)).toEqual(contenido.pda);
  });

  it("devuelve [] cuando el contenido no existe", () => {
    expect(getPDAByContenido("contenido fantasma")).toEqual([]);
  });
});
