-- Suscripción con Stripe: cliente y suscripción recurrente asociados a la membresía.
ALTER TABLE "Membership" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Membership" ADD COLUMN "stripeSubscriptionId" TEXT;

CREATE UNIQUE INDEX "Membership_stripeCustomerId_key" ON "Membership"("stripeCustomerId");
CREATE UNIQUE INDEX "Membership_stripeSubscriptionId_key" ON "Membership"("stripeSubscriptionId");
