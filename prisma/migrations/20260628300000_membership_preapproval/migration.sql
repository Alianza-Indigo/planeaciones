-- Suscripción mensual: id de la preapproval (suscripción) de Mercado Pago.
ALTER TABLE "Membership" ADD COLUMN "mpPreapprovalId" TEXT;

CREATE UNIQUE INDEX "Membership_mpPreapprovalId_key" ON "Membership"("mpPreapprovalId");
