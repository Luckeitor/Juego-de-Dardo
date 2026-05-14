# Changelog

Todos los cambios notables del proyecto se documentan acá. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [0.2.9] — 2026-05-13

### Agregado

- **Hint editable en el lobby**: arriba de la lista de jugadores ahora se muestra un texto sutil con icono de lápiz: "Tocá un nombre para cambiarlo". Aclara que los nombres son editables sin saturar la UI.

## [0.2.8] — 2026-05-13

### Corregido

- Logo de Tom Consultor en el splash de intro era prácticamente invisible: el SVG original tenía texto en `#111111` (negro) y `#404040` (gris oscuro) que sobre fondo dark `#0A0E14` no se leía. Se creó `public/tomconsultor-dark.svg` con texto blanco y llaves en un orange más vibrante (`#FF8A50` vs `#C96442`). El IntroScreen usa la variante dark.

## [0.2.7] — 2026-05-13

### Agregado

- **Eventos custom** pusheados al `dataLayer` para tracking en GA4 vía GTM:
  - `intro_dismissed` — usuario cierra el splash de Tomconsultor.
  - `game_started` — `target_score`, `player_count`.
  - `bust` — `target_score`, `prior_darts`, `prior_score`, `attempted_dart_value`, `attempted_dart_multiplier`.
  - `game_won` — `target_score`, `winner_turns`, `round`, `player_count`.
  - `rematch` — `target_score`, `player_count`.
  - `pwa_install_available` — el browser ofrece instalar (Chrome/Android).
  - `pwa_installed` — usuario instaló la app.
- `src/lib/analytics.ts`: wrapper `track(event, params)` con guard SSR y manejo de error silencioso.

## [0.2.6] — 2026-05-13

### Agregado

- **Google Tag Manager** (container `GTM-NZT58RD3`) instalado en `<head>` y noscript fallback en `<body>` para tracking de eventos vía GTM.

## [0.2.5] — 2026-05-13

### Agregado

- **SEO completo**:
  - `<title>` y meta description optimizados para "Marcador de Dardos a Medida — TomConsultor".
  - **Open Graph** completo (og:title, og:description, og:image, og:url, og:type, og:locale es_CL).
  - **Twitter Card** summary_large_image.
  - **Schema.org JSON-LD** WebApplication con creator=TomConsultor.
  - `<link rel="canonical">` apuntando a `https://dardos.smx.cl/`.
- **og-image.svg** 1200×630 con título de la app + dartboard + branding TomConsultor + URL.
- **robots.txt** permitiendo indexación con referencia al sitemap.
- **sitemap.xml** con la URL principal.

## [0.2.4] — 2026-05-13

### Cambiado

- **Tarjeta de jugador en el lobby** rediseñada para tablet/mobile:
  - Número del jugador en cuadrado más grande (40→48px) con más aire interno.
  - Espaciado generoso entre el número y el nombre (gap-3 → gap-4).
  - Botón de eliminar (🗑️) **siempre visible** (antes era hover-only, invisible en touch).
  - El botón eliminar ahora tiene 40×40px y feedback de tap (active:scale-95).
- **Nombres por default** actualizados: Tomi, Coti, Blanca, Amalia (eran Tomás, Ana, Luis, Carla).

## [0.2.3] — 2026-05-13

### Agregado

- **Splash de primera visita**: en el primer load aparece una pantalla con el logo de [Tom Consultor](https://tomconsultor.cl) ("Un desarrollo de...") por 3.5 segundos o hasta que el usuario toque la pantalla. Después se marca `dardos:intro-seen` en localStorage y nunca más vuelve a aparecer.

## [0.2.2] — 2026-05-13

### Cambiado

- **Regla de bust modificada** (regla casera): cuando un jugador se pasa con un dardo, ahora **solo ese dardo se anula**, los dardos anteriores del turno sí se suman al score. Antes se anulaba el turno completo (regla PDC oficial). Ejemplo: estabas en 260, tirás 20 + 10 + bust → quedás en 290 (no en 260).
- Pantalla de Bust actualizada: ahora dice "Solo el último dardo no contó. Los dardos anteriores del turno sí se suman."

### Corregido

- Botones "REVANCHA" / "NUEVA PARTIDA" en pantalla de victoria quedaban tapados por el toggle flotante "MODO CONTROLADOR" en mobile. El toggle ahora se oculta en victoria/bust y se aumentó el margin-bottom de los botones.

## [0.2.1] — 2026-05-13

### Agregado

- Auto-deploy continuo: cada push a `main` dispara GitHub Actions → build (`npm run lint && npm test && npm run build`) → deploy a Netlify. ~50s end-to-end con red de seguridad de tipos + tests.

## [0.2.0] — branch `feat/persistence-and-refactor` (2026-05-13)

### Agregado

- **Event Sourcing**: el estado del juego ahora se deriva 100% de un log lineal de eventos (`src/engine/gameEngine.ts`).
- **Persistencia en localStorage** automática para la partida en curso. La app sobrevive recargas (`src/lib/storage.ts`).
- **Historial de partidas**: las últimas 10 partidas ganadas se archivan en `dardos:history`.
- **Undo infinito**: si hay dardos en el turno actual, el botón DESHACER revierte el último dardo. Si el turno está vacío, hace pop del último evento del log (deshace turno completo, bust, etc.).
- **Atajos de teclado** (`src/lib/keyboard.ts`):
  - `0`-`9`: tira un dardo de ese valor.
  - `1`+`0`...`9`, `2`+`0`: combina a 10-20 (buffer de 700ms).
  - `s` / `d` / `t`: multiplicador Simple / Doble / Triple.
  - `b`: Bull 25. `Shift+B`: Bull 50.
  - `Backspace` o `u`: deshacer.
  - `Enter`: confirmar turno / pasar al siguiente jugador.
- **PWA**: manifest, iconos SVG (192, 512), favicon, service worker cache-first. Instalable y offline-capable en producción.
- **21 tests del engine** (`tests/engine.test.ts`) ejecutables con `npm test` (sin framework, solo `tsx` + `assert` nativo).
- Documentación: `docs/ARCHITECTURE.md`, `docs/DEPLOY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, README expandido.

### Cambiado

- **Refactor**: `src/App.tsx` pasó de **891 LOC** (monolito) a **~150 LOC** (router). Las pantallas viven en `src/components/`:
  - `Lobby.tsx`, `MobileGame.tsx`, `TVGame.tsx`, `BustScreen.tsx`, `VictoryScreen.tsx`, `ui/Button.tsx`.
- **Idioma**: toda la UI traducida al español. Inglés residual eliminado (`SHUFFLE` → `MEZCLAR`, `NEW GAME` → `NUEVA PARTIDA`, etc.).
- **Estado**: `App.tsx` ya no mantiene estado mutable directo — delega en el hook `useGameStore` (`src/state/useGameStore.ts`).
- **`currentTurnDarts`**: pasó de `(number | null)[]` a `(DartThrow | null)[]` para preservar `value` y `multiplier` además del score (necesario para replay/auditoría).
- **`resetGame`**: ahora trunca el log y reinicia con la config actual (jugadores + target), evitando que localStorage crezca indefinidamente.
- **`index.html`**: `lang="es"`, meta `theme-color`, link a manifest + apple-touch-icon, viewport con `viewport-fit=cover`.
- **`main.tsx`**: registra el service worker solo en producción para no romper HMR de Vite.

### Corregido

- **Bug crítico en `GAME_WON`**: el reducer resolvía el ganador por `state.currentPlayerIndex`, pero después de aplicar `TURN_CONFIRMED` ese índice ya había avanzado al siguiente jugador. En una partida real con 2+ jugadores, **habría declarado ganador a la persona equivocada**. Ahora resuelve por `playerId` del evento. Encontrado por los tests.
- Hooks orden inestable durante HMR de Vite (residual de cambios entre commits).

### Removido

- Lógica de actualización de score inline en `App.tsx` (movida al reducer puro).
- Strings hardcodeados en inglés en componentes (deuda técnica del prompt original).

---

## [0.1.0] — 2026-04-XX (inicial, generado por Google AI Studio)

### Agregado

- MVP visual con React 19 + TypeScript + Vite 6 + Tailwind v4 + Motion + Lucide.
- Pantallas: Lobby, Mobile Game, TV Game, Bust, Victory.
- Funcionalidad: agregar/quitar jugadores (max 12), nombres editables, target selector (200/300/400/500), shuffle, multiplicadores Single/Double/Triple, Bull 25/50, miss, undo del turno actual, confirm turn, detección de bust + animación, pantalla de victoria con stats.
- Toggle Mobile/TV manual.
- Estética dark + neon green (Sporty Pro) con tokens visuales en Tailwind v4.
