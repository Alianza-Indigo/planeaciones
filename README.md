# Planeaciones

Aplicacion Next.js para generar planeaciones didacticas con la API de Alianza Indigo, Google OAuth, exportacion a Google Drive y pagos por Mercado Pago.

## Stack propuesto

- Next.js App Router en Vercel.
- Neon Postgres via Vercel Marketplace.
- Prisma para usuarios, membresias, pagos, prompts y drafts temporales.
- Google OAuth con permiso `drive.file`.
- Mercado Pago para checkout y webhook de pagos.
- API central de Alianza Indigo para generacion.

## Primer arranque local

1. Copia `.env.example` a `.env.local`.
2. Llena `DATABASE_URL`, Google OAuth, Alianza Indigo y Mercado Pago.
3. Instala dependencias:

```bash
npm install
```

4. Genera Prisma y migra la base:

```bash
npm run db:generate
npm run db:migrate
```

5. Arranca la app:

```bash
npm run dev
```

## Pendientes de integracion

- Reemplazar el endpoint placeholder de Alianza Indigo por el contrato real.
- Confirmar scopes exactos de Google Drive/Docs.
- Configurar Mercado Pago con webhook firmado.
- Ajustar el prompt maestro desde el dashboard admin.
