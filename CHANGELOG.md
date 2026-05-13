# Changelog

Todos los cambios notables del proyecto se documentan acá. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased] — branch `feat/persistence-and-refactor` (2026-05-13)

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
