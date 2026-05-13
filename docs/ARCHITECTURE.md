# Arquitectura

## TL;DR

La app está construida sobre tres capas estrictamente separadas:

1. **Engine puro** (`src/engine/`): funciones sin DOM, sin React, sin side-effects. Recibe estado → devuelve estado nuevo. Es la verdad sobre las reglas del juego.
2. **Store** (`src/state/`): hook React que mantiene el log de eventos y orquesta el flujo. Despacha eventos, llama al engine, persiste.
3. **UI** (`src/components/`): componentes presentacionales. Reciben el estado derivado por props, emiten intents (callbacks). NO conocen las reglas del juego.

Este desacoplamiento permite testear las reglas sin renderizar nada, e intercambiar el método de input (teclado, voz, cámara) sin tocar la lógica.

## Event Sourcing

El estado actual del juego **nunca se muta directamente**. En su lugar, existe una lista lineal de **eventos** que describen todo lo que pasó. El estado actual se computa aplicando un **reducer** sobre la lista de eventos:

```
events: GameEvent[]  ──reduce──►  DerivedState
```

### ¿Por qué Event Sourcing?

| Problema clásico con estado mutable | Cómo lo resuelve Event Sourcing |
|---|---|
| Undo es complejo (hay que recordar el estado anterior) | Undo = `events.pop()` + re-render |
| Persistencia es bug-prone (serializar estado complejo) | Persistencia = guardar la lista de eventos |
| Debugging difícil | El log de eventos cuenta la historia exacta |
| Replay para tests es engorroso | Inyectás los eventos y assertás el estado final |

### El trade-off

Recalcular el estado desde 0 en cada cambio suena caro. En la práctica, una partida típica genera **~150 eventos** (50 turnos × 3 dardos). Reducir 150 objetos planos es microsegundos. Para sesiones extra largas, el reset de partida re-arma el log y mantiene tamaño acotado.

## Tipos de eventos

Definidos en `src/engine/gameEngine.ts` como discriminated union:

```typescript
type GameEvent =
  // Configuración / lobby
  | { type: "GAME_CONFIGURED"; targetScore: number; players: PlayerSeed[]; timestamp: string }
  | { type: "PLAYER_ADDED"; player: PlayerSeed; timestamp: string }
  | { type: "PLAYER_REMOVED"; playerId: string; timestamp: string }
  | { type: "PLAYER_RENAMED"; playerId: string; name: string; timestamp: string }
  | { type: "PLAYERS_SHUFFLED"; newOrder: string[]; timestamp: string }
  | { type: "TARGET_CHANGED"; targetScore: number; timestamp: string }

  // Juego en curso
  | { type: "GAME_STARTED"; timestamp: string }
  | { type: "DART_THROWN"; playerId: string; value: number; multiplier: DartMultiplier; timestamp: string }
  | { type: "DART_UNDONE"; timestamp: string }
  | { type: "TURN_CONFIRMED"; playerId: string; turnSum: number; darts: DartThrow[]; timestamp: string }

  // Estados terminales del turno
  | { type: "TURN_BUSTED"; playerId: string; timestamp: string }
  | { type: "BUST_ACKNOWLEDGED"; timestamp: string }
  | { type: "GAME_WON"; playerId: string; finalScore: number; timestamp: string }
  | { type: "GAME_RESET"; timestamp: string };
```

Cada evento es **inmutable** y serializable a JSON. Esto es lo que permite la persistencia en localStorage.

## Flujo de un turno

```
[Tomás está en turno, score = 60]

UI: usuario toca "T20"
  ↓
App.tsx: handleScoreInput(20) → store.throwDart(20, 3)
  ↓
useGameStore.throwDart():
  1. Construye dart = { value: 20, multiplier: 3, score: 60 }
  2. Provisiona los slots: [dart, null, null]
  3. evaluateTurn(currentScore=60, [dart,null,null], target=300) → CONTINUE
  4. Append evento { type: "DART_THROWN", playerId: "tomas", value: 20, multiplier: 3, ... }
  ↓
events[] cambia
  ↓
useMemo re-ejecuta reduce(events) → nuevo DerivedState con dart en slot 0
  ↓
React re-renderiza MobileGame con el nuevo state
  ↓
useEffect [events] dispara saveEvents(events) → localStorage
```

## Reducer (`reduce`)

El reducer es **puro y total**: para cada (estado, evento), produce un nuevo estado. Está implementado como un `switch` exhaustivo sobre `ev.type`:

```typescript
function step(state: DerivedState, ev: GameEvent): DerivedState {
  switch (ev.type) {
    case "DART_THROWN": {
      const darts = [...state.currentTurnDarts];
      const empty = darts.indexOf(null);
      if (empty === -1) return state;       // 3 slots ya llenos → ignorar
      darts[empty] = createDart(ev.value, ev.multiplier);
      return { ...state, currentTurnDarts: darts };
    }
    // ... otros casos
  }
}
```

**Reglas que sigue el reducer**:
- Nunca muta `state` ni los arrays/objetos anidados — siempre crea nuevos.
- Si un evento es inválido (ej. tirar un dart cuando ya hay 3), retorna `state` sin cambios. No throwsa.
- Los efectos secundarios (toasts, sonidos, navegación) son responsabilidad de la UI, no del reducer.

## Undo

Hay dos modos de undo:

| Estado actual | Acción del botón "DESHACER" | Implementación |
|---|---|---|
| Hay 1+ dardos en el turno actual | Borra el último dardo del turno | Append evento `DART_UNDONE` |
| Turno vacío | Revierte el evento anterior | `events.slice(0, -1)` |

El primer modo conserva el log completo (event sourcing puro). El segundo lo trunca, lo que es más liviano pero menos puro. En la práctica funciona porque el reducer es determinístico — re-aplicar los N-1 eventos siempre da el estado correcto.

## Persistencia

```
src/lib/storage.ts:
  dardos:current-game  → GameEvent[]   (single in-progress game)
  dardos:history       → ArchivedGame[] (max 10, newest first)
```

- **Al iniciar la app**: `useGameStore` intenta hidratarse desde `dardos:current-game`. Si no hay nada, usa eventos default (4 jugadores precargados).
- **En cada cambio de `events[]`**: un `useEffect` dispara `saveEvents(events)`.
- **Al disparar `GAME_WON`**: otro `useEffect` archiva la partida en `dardos:history`. Un `useRef` evita duplicar el archivado si el efecto vuelve a correr.
- **Al hacer `resetGame`**: el log se trunca a un único `GAME_CONFIGURED` con los players/target actuales. Esto evita que localStorage crezca infinitamente entre partidas.

## Atajos de teclado

`src/lib/keyboard.ts` es un hook que se monta en `App.tsx` durante el estado `PLAYING`. Maneja:

- **Buffer de números**: cuando apretás `1` o `2`, espera 700ms por un segundo dígito. Si llega, dispara 10-20. Si timeout, dispara 1 o 2.
- **Multiplicadores**: `s` / `d` / `t` cambian el multiplier sin tirar dardo.
- **Bull**: `b` = 25, `Shift+B` = 50 (se tira inmediato).
- **Undo**: `Backspace` o `u`.
- **Confirm**: `Enter`.

El hook usa un `handlersRef` para evitar recrear el event listener cuando cambian los handlers — solo lo monta una vez cuando `enabled` cambia.

## PWA

- `public/manifest.json` declara la app como instalable (display `standalone`, theme color neon green).
- `public/sw.js` es un service worker simple **cache-first** para estáticos. Se registra solo en producción (`import.meta.env.PROD`) para no romper el HMR de Vite.
- Iconos SVG (`icon-192`, `icon-512`, `favicon`) — escalan a cualquier tamaño sin perder calidad.

## Decisiones explícitas (y sus por qués)

| Decisión | Alternativa rechazada | Por qué |
|---|---|---|
| Event Sourcing | Estado mutable con useState anidado | Undo infinito + persistencia + replay para tests salen gratis |
| `tsx + assert` para tests | Vitest / Jest | Cero dependencias nuevas, suite chica, ejecución instantánea |
| SVG icons (no PNG) | PNG renderizados | Escalan a cualquier resolución, peso mínimo, fáciles de editar |
| Tailwind v4 (existente) | tokens.css custom | Ya estaba en el repo de AI Studio y la migración no agrega valor |
| React 19 (existente) | Vanilla JS (spec original) | MVP visual decente ya armado; reescribir era 8-10h vs. iterar 4-5h |
| Service worker solo en PROD | También en dev | Romperíamos HMR de Vite y debugger flow |
| Reducer total que retorna `state` ante eventos inválidos | Throw o assert | Tolerante a logs corruptos (clientes viejos, manipulación de localStorage) |
