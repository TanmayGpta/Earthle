@AGENTS.md

# Earthle

Geography quiz website: a country lights up on a 3D globe, the player names it (or its capital). Single-page Next.js app, all client-side, no backend.

## Stack
- Next.js 16.4 (App Router, Turbopack) + React 19 + TypeScript. Next APIs differ from training data — check `node_modules/next/dist/docs/` before using framework APIs.
- Tailwind v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config`).
- `globe.gl` / three.js for globes, `lucide-react` icons, `canvas-confetti`.
- Commands: `npm run dev`, `npm run build`, `npm run lint`. No test suite.

## Layout
- `src/app/page.tsx` — owns ALL game state (queue, answers, streak, timer, settings) and the landing page markup. Game flow: `startGame` → `handleSubmitAnswer` / `handleSkip` / `handleReveal` → `advanceToNext` → game over.
- `src/components/GameHUD.tsx` — in-game UI: MCQ option generation, type-in checking, keyboard shortcuts (1–4, Enter, Space = skip), feedback toasts, trivia card.
- `src/components/InteractiveGlobe.tsx` — game globe; colors polygons by answer status, flies camera to target.
- `src/components/HeroGlobe.tsx` — landing-page auto-rotating globe driven by `scrollProgress`.
- `src/components/GameOverModal.tsx` — results, rank, share-to-clipboard.
- `src/components/ArtDecoFrame.tsx`, `GothicLogo.tsx` — decorative UI.
- `src/data/countries.ts` — generated list (177 entries) of `Country` (see `src/types/game.ts`). Regenerate with `src/scripts/generate-countries.js`; manual patches in `src/scripts/update-fallbacks.js`.
- `public/data/ne_110m.geojson` — Natural Earth 110m borders. Polygons join to countries via `properties.ADM0_A3` == `Country.code`.

## Data facts
- Continent values in data: `Africa`, `Asia`, `Europe`, `North America`, `South America`, `Oceania`, `Antarctica`. UI filters must use these exact strings.
- Antarctica has capital `"None"` — exclude from capitals mode.

## Design system (current)
- Dark forest + acid lime. Tokens (hardcoded hex in classNames today):
  bg `#1c2c26`, deep `#13201b`/`#0e1814`, land `#274137`, border `#275f4b`, muted `#628c7d`, text `#f5f5f1`, accent `#e5ff42` (hover `#d4ee38`), correct `#10b981`, wrong `#f87171`, skipped `#fb923c`.
- Fonts: Instrument Serif (headings, often italic) + Plus Jakarta Sans, loaded in `src/app/layout.tsx`.
- Sharp-cornered buttons, uppercase mono/tracking-wide labels, Art Deco corner frames.
- When adding styles, prefer moving colors into Tailwind `@theme` tokens in `globals.css` over adding new hex literals.

## Conventions
- Globe components must be client-only (`dynamic(..., { ssr: false })`).
- Game rules live in `src/lib/game.ts`: answer matching (accent/punctuation-insensitive, capital aliases), country pool filtering, seeded Fisher–Yates shuffle, MCQ distractors. The HUD decides correctness; `page.tsx` only records it.
- Each run gets a fresh random seed (shown as "Run #…" on the results). Nothing is persisted — no localStorage, no backend.
