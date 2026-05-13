<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎯 180° Count-Up

Marcador de dardos modo **Count-Up** para jugar con amigos. Web app PWA, instalable y offline.

- **2 a 12 jugadores** sin degradación visual
- **Target configurable**: 200, 300, 400, 500
- **Detección de bust en tiempo real** + animaciones
- **Undo infinito** vía event sourcing (cada dardo es un evento)
- **Persistencia automática** en localStorage (la partida sobrevive a recargas)
- **Atajos de teclado**: ideal para marcador con tablet + jugadores
- **Modo TV** auto-detectado en pantallas grandes (>1024px)

## Stack

- React 19 + TypeScript + Vite 6 + Tailwind v4
- Motion (Framer Motion) para animaciones
- Lucide icons
- Sin dependencias de testing — tests con `tsx` + `assert` nativo

## Cómo correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `0`-`9` | Número de la zona (1-9). Tipea `1`+`0` rápido para 10, `2`+`0` para 20, etc. |
| `s` / `d` / `t` | Multiplicador Simple / Doble / Triple |
| `b` | Bull 25 — `Shift+B` para Bull 50 |
| `Backspace` o `u` | Deshacer (turno actual o el evento anterior si el turno está vacío) |
| `Enter` | Confirmar turno / pasar al siguiente jugador |

## Scripts

```bash
npm run dev      # arranca Vite en :3000
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
npm run lint     # tsc --noEmit (type check)
npm test         # corre tests del engine (tsx tests/engine.test.ts)
```

## Arquitectura

```
src/
├── App.tsx                    Router entre pantallas + handlers de UI
├── main.tsx                   Bootstrap React + registro de service worker
├── types.ts                   GameStatus, Player, GameState, NEON_COLORS
├── index.css                  Tailwind + tokens visuales (Bebas Neue, neon green)
├── components/                Componentes de presentación
│   ├── Lobby.tsx
│   ├── MobileGame.tsx
│   ├── TVGame.tsx
│   ├── BustScreen.tsx
│   ├── VictoryScreen.tsx
│   └── ui/Button.tsx
├── engine/
│   └── gameEngine.ts          Funciones puras (reducer + predicados). Sin DOM, sin React.
├── state/
│   └── useGameStore.ts        Hook que mantiene events[] y deriva state via reduce()
├── lib/
│   ├── storage.ts             Wrapper de localStorage (current-game + history max 10)
│   └── keyboard.ts            Hook useKeyboard con buffer 700ms para 10-20
└── vite-env.d.ts
```

El estado **nunca se muta directamente** — siempre se deriva del log de eventos (`throwsHistory[]`):

```
GAME_CONFIGURED → GAME_STARTED → DART_THROWN × 3 → TURN_CONFIRMED → ... → GAME_WON
```

Para deshacer cualquier acción, hacés pop del último evento del log y el reducer reconstruye el estado completo.

## Tests

21 tests cubren: lobby, dardos, turnos, bust, victoria, undo via pop, rotación de 2/3/12 jugadores, predicados puros.

```bash
npm test
```

## Deploy

### Netlify Drop (drag & drop)

```bash
npm run build
# Arrastrá la carpeta dist/ a https://app.netlify.com/drop
```

### Vercel

```bash
npm run build
vercel --prod
```

### GitHub Pages

Configurar GitHub Actions con `vite build` + deploy de `dist/` a la rama `gh-pages`.

## TODO v2

- Modo Killer (con vidas)
- Modo por equipos (6v6, 4v4v4, 3v3v3v3)
- Modo Cricket
- Sync multi-dispositivo (BroadcastChannel para 2 ventanas, PartyKit/WebSockets para LAN)
- Stats históricos con gráficos
- Voz para anotar dardos (Web Speech API)
- Pantalla de historial de las últimas 10 partidas (ya guardadas en localStorage, falta UI)
