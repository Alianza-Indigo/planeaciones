# Planeaciones

Aplicación Next.js (App Router) para generar planeaciones didácticas de la NEM
con IA, autenticación con Google, exportación a Google Drive y membresías de
pago con Mercado Pago y Stripe.

## Stack

- **Next.js 16** (App Router) desplegado en Vercel.
- **Neon Postgres** vía la integración de Vercel.
- **Prisma** para usuarios, membresías, pagos, prompts y borradores temporales.
- **NextAuth** con Google OAuth (scope `drive.file`).
- **Google Gemini** como motor de generación (`GEMINI_MODEL`).
- **Mercado Pago** y **Stripe** para checkout y webhooks de suscripción.
- **Web Push** (VAPID) para notificaciones de la PWA.

## Pagos y membresías

- Modelo de **suscripción recurrente** (mensual/anual); el docente elige el
  método en `/cuenta`.
- Los precios se editan desde el panel admin (`/admin/settings`) y se guardan en
  la tabla `AppSetting`; no hace falta crear productos/precios en los
  proveedores.
- Los webhooks verifican la firma, releen el estado en el proveedor (fuente
  autoritativa) y son idempotentes:
  - Mercado Pago → `POST /api/payments/webhook`
  - Stripe → `POST /api/stripe/webhook`
- Sin las variables de un proveedor configuradas, ese método simplemente no se
  ofrece en la UI (Stripe requiere `STRIPE_SECRET_KEY`).

## Generación

- Los usuarios sin membresía activa tienen un límite gratuito
  (`FREE_GENERATION_LIMIT`, actualmente 4); los miembros activos generan sin
  tope. Los administradores no tienen límite.
- Hay un límite de ritmo por usuario para acotar el costo ante ráfagas.
- Cada planeación se guarda como **borrador temporal** que expira; un cron diario
  (`/api/drafts/cleanup`, ver `vercel.json`) limpia los vencidos.

## Primer arranque local

1. Copia `.env.example` a `.env.local` y llena las variables (ver más abajo).
2. Instala dependencias:

   ```bash
   npm install
   ```

3. Genera Prisma y migra la base:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Arranca la app:

   ```bash
   npm run dev
   ```

## Comandos útiles

```bash
npm run dev         # desarrollo
npm run build       # prisma generate + next build
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run db:migrate  # prisma migrate dev
npm run db:studio   # Prisma Studio
npm run db:seed     # datos iniciales
```

## Variables de entorno

Ver `.env.example` para la lista completa. Grupos principales:

- **App/Auth**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAILS`.
- **Base de datos**: `DATABASE_URL` (pooled) y `DATABASE_URL_UNPOOLED` (directa,
  para migraciones).
- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Gemini**: `GEMINI_API_KEY`, `GEMINI_MODEL`.
- **Mercado Pago**: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`,
  `MERCADOPAGO_SUCCESS_URL`, `MERCADOPAGO_FAILURE_URL`.
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (opcional
  `STRIPE_PUBLISHABLE_KEY`).
- **Otros**: `PUBLIC_BASE_URL`, `CRON_SECRET`, `DRAFT_TTL_HOURS`, `VAPID_*`.

> En producción, los `*_WEBHOOK_SECRET` son obligatorios: los endpoints de
> webhook responden `500` si faltan, para no aceptar notificaciones sin firmar.
