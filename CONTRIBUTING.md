# Contribuir

Gracias por querer agregar algo al juego 🎯. Esta guía te ayuda a moverte rápido en el repo.

## Setup

```bash
gh repo clone Luckeitor/Juego-de-Dardo
cd Juego-de-Dardo
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Comandos útiles

```bash
npm run dev      # Vite en :3000 con HMR
npm run build    # genera dist/
npm run preview  # sirve dist/ en :4173
npm run lint     # tsc --noEmit (type check, sin emit)
npm test         # corre tests/engine.test.ts
```

## Cómo se organiza el código

Lee primero **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** para entender las 3 capas (engine / store / UI) y el Event Sourcing.

```
src/
├── engine/          ← lógica pura, sin DOM. Testear acá.
├── state/           ← hook React que orquesta. No lógica de juego.
├── components/      ← UI. Recibe state por props.
├── lib/             ← side-effects (storage, keyboard).
└── App.tsx          ← router entre pantallas.

tests/               ← tests del engine.
public/              ← manifest, sw, iconos.
docs/                ← arquitectura, deploy.
```

## Agregar una feature nueva

El patrón general es:

1. **Definir el evento** en `src/engine/gameEngine.ts`:

```typescript
export type GameEvent =
  | ... // eventos existentes
  | { type: "MY_NEW_EVENT"; data: ...; timestamp: string };
```

2. **Manejarlo en el reducer** (la función `step()`):

```typescript
case "MY_NEW_EVENT":
  return { ...state, /* nuevo state */ };
```

3. **Exponer una acción en el store** (`src/state/useGameStore.ts`):

```typescript
const myNewAction = useCallback((data) => {
  append({ type: "MY_NEW_EVENT", data, timestamp: now() });
}, [append]);
```

4. **Agregar a la interfaz `GameStore`** y retornarla.

5. **Llamarla desde la UI** vía props/callbacks.

6. **Test del reducer** en `tests/engine.test.ts`:

```typescript
test("MY_NEW_EVENT does the thing", () => {
  const events: GameEvent[] = [..., { type: "MY_NEW_EVENT", ... }];
  const s = reduce(events);
  assert.equal(s.something, expected);
});
```

7. **Type-check + tests**: `npm run lint && npm test`.

## Convención de commits

Usamos commits semánticos (loose conventional commits):

- `feat:` — nueva feature visible al usuario
- `fix:` — bug fix
- `refactor:` — cambio interno sin alterar comportamiento
- `style:` — formato, espacios, comentarios (no afecta lógica)
- `docs:` — solo documentación
- `test:` — agregar o actualizar tests
- `chore:` — config, deps, build (sin afectar src/)

Ejemplos:

```
feat: agregar modo Killer con sistema de vidas
fix: GAME_WON ahora busca winner por playerId
refactor: extraer InputPad de MobileGame
docs: explicar el buffer del keyboard hook
test: cubrir BUST en el primer dardo del turno
chore: actualizar Vite a 6.5
```

## Estilo de código

- TypeScript estricto. `npm run lint` debe pasar sin errores antes de commitear.
- No usar `any`. Si TS no puede inferir un tipo, definilo explícito.
- Para componentes React: function components con TS interfaces para props. NO `React.FC` excepto si necesitás `children` heredado.
- Tailwind utility classes — no escribir CSS custom salvo en `index.css` para tokens globales.
- Strings visibles al usuario: **siempre en español**.
- Strings internos (enums, types): **en inglés** (`"BUST"`, `"VICTORY"`, etc.).

## PRs

1. Branch desde `main` con nombre descriptivo: `feat/modo-killer`, `fix/bust-edge-case`.
2. Mantené el PR enfocado: una feature/fix por PR.
3. Incluí en la descripción:
   - **Qué cambia** (1-2 líneas)
   - **Por qué** (motivación / issue)
   - **Cómo testear** (pasos manuales o `npm test`)
   - **Screenshots o GIFs** si es cambio visual.
4. Asegurate que `npm run lint && npm test` pasan.

## Reportar bugs

Abrí un issue con:

- **Pasos para reproducir**.
- **Comportamiento esperado vs. observado**.
- **Browser + versión**.
- **Captura de pantalla** si es visual.
- Si tenés el log de localStorage (`dardos:current-game`), pegalo — es la mejor forma de reproducir el bug exacto.

## Roadmap (v2)

- Modo **Killer** (con vidas, ideal 12 jugadores).
- Modo por **equipos** (6v6, 4v4v4, 3v3v3v3).
- Modo **Cricket**.
- **BroadcastChannel** para sincronizar 2 ventanas (TV display + controller).
- **Stats históricos** con gráficos (los datos ya están en `dardos:history`).
- **Voz** para anotar dardos (Web Speech API).
- **Pantalla de historial** de las últimas 10 partidas.
- **Tema claro** (toggle).
- **i18n** con archivo de strings (preparado: todos los textos están en componentes, falta extraerlos a un objeto).

## Preguntas

Abrí un issue con la etiqueta `question` o discutí en el README del repo.
