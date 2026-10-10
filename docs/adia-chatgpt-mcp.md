# ADIA para ChatGPT (MCP) — integración experimental

Esta integración utiliza el repositorio existente. No sustituye la PWA ni modifica /api/generate, pagos, sesiones, Gemini o Prisma.

## Archivos
- app/api/mcp/route.ts — endpoint JSON-RPC sobre HTTP POST.
- lib/mcp/adia.ts — consultas al currículo y validación contra contenido/PDA real.
- lib/mcp/registry.ts — herramientas y recurso UI.
- lib/mcp/rpc.ts — operaciones MCP.
- lib/mcp/widget.ts — formulario HTML autocontenido.

## Seguridad y despliegue
ADIA_MCP_ENABLED no está definido por defecto: /api/mcp responde 404.
**No habilitar en producción hasta configurar y verificar autenticación compatible con el espacio Business** (OAuth o gateway con control de acceso). Compartir privadamente una app en ChatGPT Business no bloquea por sí solo solicitudes HTTP directas. Las herramientas de preparación incluyen prompts del motor ADIA: no deben publicarse sin control de acceso.

No se añaden secretos a GitHub ni se activan variables en Vercel.

## Pruebas de aceptación pendientes
1. TypeScript: npm ci y npm run typecheck.
2. Pruebas existentes: npm test y npm run build.
3. En staging seguro: initialize, tools/list, resources/read, tools/call.
4. Probar el widget en ChatGPT Business con sus controles y canal de mensajes.
5. Confirmar que el modelo del usuario genera realmente la planeación y que no llama a Gemini.
6. Probar sesión no autorizada, límites de solicitudes y generación de documentos Word.
7. Habilitar ADIA_MCP_ENABLED=true sólo después de completar 1–6.

El widget es una primera versión de interfaz; la exportación DOCX nativa todavía no está implementada.
