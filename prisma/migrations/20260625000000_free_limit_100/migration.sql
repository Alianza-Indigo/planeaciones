-- Etapa de pruebas: límite de generaciones gratuitas elevado a 100.
ALTER TABLE "Membership" ALTER COLUMN "generationLimit" SET DEFAULT 100;

-- Alinear membresías no activas existentes con el nuevo límite de pruebas.
UPDATE "Membership"
SET "generationLimit" = 100
WHERE "status" <> 'ACTIVE' AND "generationLimit" < 100;
