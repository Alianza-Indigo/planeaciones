-- Plan gratuito: límite real de 4 generaciones (antes 100 en pruebas).
ALTER TABLE "Membership" ALTER COLUMN "generationLimit" SET DEFAULT 4;

-- Alinear el límite mostrado de las membresías no activas (plan gratuito) a 4.
-- Las activas de pago conservan su límite (p. ej. 999999 = ilimitado).
UPDATE "Membership"
SET "generationLimit" = 4
WHERE "status" <> 'ACTIVE' AND "generationLimit" <> 999999;
