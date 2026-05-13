# Guía de Deploy

La app es 100% estática después de `npm run build`. No requiere backend, base de datos ni runtime server. Cualquier hosting estático funciona.

## Build

```bash
npm install
npm run build
```

Esto genera la carpeta `dist/` con:

- `index.html` (con el HTML hashed para cache-busting)
- `assets/index-*.js` (bundle JS minificado)
- `assets/index-*.css` (CSS minificado, Tailwind purgado)
- `manifest.json`, `sw.js`, `favicon.svg`, `icon-192.svg`, `icon-512.svg` (copiados de `public/`)

## Verificar el build localmente

```bash
npm run preview
```

Abre `http://localhost:4173` (Vite default). El service worker se registrará y la app debería funcionar offline después del primer load.

---

## Opción A — Netlify Drop (recomendado para pruebas rápidas)

1. Corré `npm run build`.
2. Andá a https://app.netlify.com/drop
3. Arrastrá la carpeta `dist/` al área de drop.
4. Netlify te asigna una URL del estilo `https://random-name.netlify.app`.

**Pros**: cero config, deploy en < 60 segundos, HTTPS automático (necesario para que el service worker se active).

**Contras**: cada drop nuevo es una URL nueva. Para una URL estable, conectá Netlify al repo (ver opción B).

## Opción B — Netlify conectado a GitHub

1. En Netlify: **Add new site** → **Import from Git** → conectá tu cuenta de GitHub.
2. Seleccioná el repo `Luckeitor/Juego-de-Dardo`.
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 20 o superior (default suele ser suficiente).
4. Click **Deploy**.

Después de eso, cada push a `main` (o la rama configurada) dispara un re-deploy automático.

## Opción C — Vercel

```bash
npm install -g vercel
vercel --prod
```

Vercel autodetecta Vite. La primera vez te pregunta el nombre del proyecto, después es un comando.

Para deploy automático desde GitHub: **vercel.com → Import Project → seleccionar repo**. Configuración auto-detectada.

## Opción D — GitHub Pages

1. Agregá un workflow en `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

2. En el repo: **Settings → Pages → Source**: `GitHub Actions`.

3. Si usás un repo project (no `<user>.github.io`), agregá esto a `vite.config.ts`:

```ts
export default defineConfig({
  base: "/Juego-de-Dardo/",  // ← nombre del repo
  // ...
})
```

(necesario para que las rutas de assets en `index.html` apunten a la subruta correcta).

## Opción E — Cloudflare Pages

Mismo flow que Netlify: **Pages → Create project → Connect to Git → seleccionar repo**.

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Framework preset**: `Vite`

---

## Notas sobre el service worker

- El service worker **solo se registra en producción** (`import.meta.env.PROD`). En dev, Vite usa HMR y un SW activo rompería el flow.
- Después del primer deploy, los visitantes guardarán la app cacheada. **Si cambiás el código, hay que invalidar el cache**:
  - El nombre del cache está hardcoded a `dardos-v1` en `public/sw.js`.
  - Para forzar refresh: cambiá a `dardos-v2` antes de buildear. El `activate` handler borra caches viejos automáticamente.
- En desarrollo de producción, abrí Chrome DevTools → Application → Service Workers → **Unregister** para empezar limpio.

## Headers de seguridad (opcional pero recomendado)

Si tu host lo permite, agregá estos headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Para Netlify, agregar `public/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

## Variables de entorno

La app **no usa ninguna variable de entorno** después del refactor. El `.env.example` que viene del template original de AI Studio (para `GEMINI_API_KEY`) es vestigial — ignoralo, no lo necesitamos.

## Checklist pre-deploy

- [ ] `npm run lint` → 0 errores
- [ ] `npm test` → 21/21 pasan
- [ ] `npm run build` → genera `dist/` sin warnings
- [ ] `npm run preview` → app funciona local
- [ ] Probar en mobile real (Chrome iOS/Android) — touch + PWA install
- [ ] Probar en desktop > 1024px — modo TV auto-activa
- [ ] Tirar 1 partida completa con bust + victoria
- [ ] Recargar mid-partida → estado persiste

## Métricas objetivo (Lighthouse)

| Métrica | Objetivo | Actual estimado |
|---|---|---|
| Performance | 90+ | ~95 (sin animaciones críticas, SVG icons, bundle pequeño) |
| Accessibility | 90+ | ~85 (faltan algunos `aria-label` en botones-icono) |
| Best Practices | 90+ | ~95 |
| SEO | N/A | No aplica — app local |
| PWA | Pass | Pass (manifest + SW + HTTPS) |
