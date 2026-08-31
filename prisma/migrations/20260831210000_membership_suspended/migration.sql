-- Pausa administrativa de la membresía: bloquea la generación hasta que un admin
-- reactive la cuenta. Ortogonal al estado de la suscripción.
ALTER TABLE "Membership" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;
