<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎯 180° Count-Up

**Marcador de dardos modo Count-Up para jugar con amigos.**
Web app instalable (PWA), offline, sin backend.

![React](https://img.shields.io/badge/react-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.8-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-6-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-21%2F21-00ff88)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

</div>

---

## ¿Qué es esto?

Una app web para anotar partidas de dardos en modalidad **Count-Up**: todos los jugadores parten en 0, gana el primero que llega **exacto** al target (200, 300, 400 o 500). Pasarse = bust, el turno se anula.

Pensada para el caso real: **un dispositivo móvil o tablet rota entre los jugadores para anotar**, y opcionalmente se castea a una TV para que todos vean el marcador en grande.

## Features

- 🎮 **2 a 12 jugadores** sin degradación visual.
- 🎯 **Detección de bust en tiempo real** con warning visual.
- ⏪ **Undo infinito** vía Event Sourcing — podés volver atrás cualquier acción.
- 💾 **Auto-save**: la partida sobrevive a recargas (localStorage).
- 🗂️ **Historial** de las últimas 10 partidas terminadas (datos guardados, falta UI).
- ⌨️ **Atajos de teclado** para marcar súper rápido con tablet + teclado bluetooth.
- 📺 **Modo TV** auto-detectado en pantallas grandes (>1024px) con grid de jugadores estilo broadcast.
- 📱 **PWA**: instalable en iOS/Android, funciona offline.
- 🌐 **100% en español**.

## Stack

| Tecnología | Para qué |
|---|---|
| **React 19** | UI declarativa |
| **TypeScript 5.8** | Tipos estrictos |
| **Vite 6** | Dev server + build |
| **Tailwind 4** | Estilos utility-first + tokens (Bebas Neue, neon green) |
| **Motion** (ex Framer Motion) | Animaciones |
| **Lucide React** | Iconos |
| `tsx` + `assert` nativo | Tests sin framework |

**Cero dependencias en runtime** además de React + Motion + Lucide. **Sin backend**. **Sin DB**. Todo vive en localStorage.

## Quick start

```bash
gh repo clone Luckeitor/Juego-de-Dardo
cd Juego-de-Dardo
npm install
npm run dev
```

Abre `http://localhost:3000`. Listo.

## Atajos de teclado

Si estás casteando a una TV y tenés un teclado conectado, podés anotar sin tocar la pantalla:

| Tecla | Acción |
|---|---|
| `0`-`9` | Tira un dardo de ese valor (0 = miss) |
| `1`+`0`...`9`, `2`+`0` | Tira 10-20 (típea las dos cifras rápido) |
| `s` / `d` / `t` | Multiplicador **S**imple / **D**oble / **T**riple |
| `b` | Bull 25 — **Shift+B** para Bull 50 |
| `Backspace` o `u` | Deshacer |
| `Enter` | Confirmar turno / pasar al siguiente |

> El buffer para números de dos dígitos tiene 700ms de timeout. Si solo necesitás 1 o 2 (single), esperá medio segundo o seguí con otra tecla.

## Cómo se ve

> _Screenshots y GIFs van acá una vez deployada la app._

### Lobby (mobile + desktop)
Selector de target, lista editable de jugadores, shuffle aleatorio del orden.

### Pantalla de juego (mobile)
Card grande del jugador activo, 3 slots para los dardos, input pad con multiplicadores, warning de bust en tiempo real, undo + confirm visibles.

### Modo TV
Grid de jugadores estilo broadcast con score gigante, sidebar con el jugador en turno, ticker con stats (highest turn, top rank).

## Arquitectura

Lee **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** para el detalle. TL;DR:

```
events: GameEvent[]  ──reduce──►  DerivedState  ──props──►  Components
        (append-only)              (puro)
```

- **Engine puro** (`src/engine/`) — reglas del juego, sin DOM, sin React.
- **Store** (`src/state/useGameStore.ts`) — hook que mantiene el log de eventos.
- **UI** (`src/components/`) — recibe el estado por props, emite intents.

Cada acción del jugador (`tirar dardo`, `confirmar turno`, `cambiar target`) se traduce a un **evento inmutable** que se appendea al log. El estado se recalcula al vuelo desde el log. **Undo = pop del log**.

### Estructura del repo

```
.
├── public/                    Assets estáticos (manifest, sw, iconos)
├── src/
│   ├── App.tsx                Router + handlers de UI (~150 LOC)
│   ├── main.tsx               Bootstrap React + registro SW
│   ├── types.ts               GameStatus, Player, NEON_COLORS
│   ├── index.css              Tailwind + tokens visuales
│   ├── components/            UI presentacional
│   │   ├── Lobby.tsx
│   │   ├── MobileGame.tsx
│   │   ├── TVGame.tsx
│   │   ├── BustScreen.tsx
│   │   ├── VictoryScreen.tsx
│   │   └── ui/Button.tsx
│   ├── engine/
│   │   └── gameEngine.ts      Reducer puro + predicados (sin DOM, sin React)
│   ├── state/
│   │   └── useGameStore.ts    Hook con events[] + dispatch
│   ├── lib/
│   │   ├── storage.ts         localStorage wrapper
│   │   └── keyboard.ts        Hook useKeyboard con buffer 700ms
│   └── vite-env.d.ts
├── tests/
│   └── engine.test.ts         21 tests (tsx + assert nativo)
├── docs/
│   ├── ARCHITECTURE.md        Explicación de Event Sourcing + capas
│   └── DEPLOY.md              Netlify, Vercel, Pages, Cloudflare
├── CHANGELOG.md
├── CONTRIBUTING.md
├── README.md                  (este archivo)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scripts

```bash
npm run dev        # arranca Vite en :3000 con HMR
npm run build      # genera dist/ minificado
npm run preview    # sirve dist/ en :4173 (verificar build antes de deployar)
npm run lint       # tsc --noEmit (type check, sin emitir archivos)
npm test           # corre tests/engine.test.ts con tsx
```

## Deploy

Lee **[docs/DEPLOY.md](docs/DEPLOY.md)** para guías paso a paso de:

- Netlify Drop (drag & drop, recomendado para pruebas rápidas)
- Netlify conectado a GitHub
- Vercel
- GitHub Pages (con workflow incluido)
- Cloudflare Pages

## Testing

```bash
npm test
```

**21 tests** cubren:

- Configuración del lobby (agregar/quitar/renombrar/shuffle jugadores)
- Cálculo de scores de dardos (single/double/triple, bull, miss)
- Lógica de turno (3 dardos, confirm, advance index, wrap a próxima ronda)
- **Bust**: turno se anula, score queda igual, status cambia
- **Victory**: ganador resuelto por `playerId` del evento
- **Undo**: pop del log restaura estado exacto
- Rotación de 2, 3 y 12 jugadores sin skips
- Predicados puros (`wouldBust`, `wouldWin`, `evaluateTurn`, `sumDarts`)

Los tests no usan framework — `tsx` + `assert` nativo de Node. La suite corre en **< 100ms**.

## Contribuir

Lee **[CONTRIBUTING.md](CONTRIBUTING.md)**. TL;DR:

- Branch desde `main` con nombre descriptivo.
- Para features nuevas: definir evento → reducer → store action → UI → test.
- Commits semánticos (`feat:`, `fix:`, `refactor:`, etc.).
- `npm run lint && npm test` antes de PR.

## Roadmap

Ver **[CHANGELOG.md](CHANGELOG.md)** para qué se viene:

- Modo **Killer** (con vidas)
- Modo por **equipos**
- Modo **Cricket**
- **BroadcastChannel** para sync TV display + controller
- **Stats históricos** con gráficos (datos ya guardados)
- **Voz** para anotar dardos
- **Pantalla de historial** (las últimas 10 partidas ya están en localStorage)
- **Tema claro**
- **i18n** real con archivo de strings

## Licencia

Apache-2.0 — ver headers SPDX en los archivos.

---

<div align="center">

**Hecho con ❤️ + Claude Code**.

Reportá bugs o ideas en [Issues](https://github.com/Luckeitor/Juego-de-Dardo/issues).

</div>
