# Rev Silicon website

A responsive React and TypeScript website for Rev Silicon, a Texas A&M student semiconductor organization. The supplied Claude Design exports are retained as visual references only; the runnable site is implemented in `src/`.

## Setup

Requirements:

- Node.js 20.19+ or 22.12+
- npm 10+

```bash
npm install
npm run dev
```

The development server prints its local URL. The app is served from the root path (`/`).

## Checks and production build

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

The production output is written to `dist/`. The host must serve `index.html` as the fallback for `/projects`, `/join`, and `/sponsor`, because routing uses the browser History API. `/about` (the Team page) is parked and redirects to Home.

## Project structure

- `src/data/site.ts` — all editable copy: navigation, mission, values, process stages, teams, event calendar, project schedule, and the org chart
- `src/pages/` — Home, Projects, Join, and Sponsor routes. Three pages are parked (kept, not routed): `AboutPage.tsx` (Team / officers), `ProjectsPageFull.tsx` (the full Projects page), and `HomePageClassic.tsx` (the Home page before the dark redesign). To restore one, add it back in `App.tsx`, `validPaths` in `router.tsx`, and `site.nav`.
- `src/components/CircuitField.tsx` — fixed backdrop on every page: two-tone (maroon and navy) procedurally routed traces, travelling signals, and traces that light up under the cursor
- `src/components/ChipEmblem.tsx` — Home hero chip: the wolf mark in a neon package with fanned-out leads and inbound pulses
- `src/components/DecodeText.tsx` — scramble-in reveal used for the P.O.L.I.T.E name
- `src/components/Wafer.tsx` — Sponsor hero: a tilted, slowly turning wafer with a probe sweep rippling out from our chip
- `src/components/ClosingCta.tsx` — the flicker-grid join band that closes the Home page
- `src/components/HeroReveille.tsx` — the earlier Reveille run-cycle hero, used only by the parked classic Home page
- `src/components/EventChart.tsx` — club calendar plotted as a rising chart with click-to-open detail
- `src/logoMark.ts` — crop box that reduces the logo plate to Reveille alone
- `src/components/ProcessFlow.tsx` — the six-stage "concept to silicon" diagram set
- `src/components/ProjectTimeline.tsx` — architecture-to-tapeout schedule rail
- `src/components/ChipScene.tsx` — the accelerator module rebuilt in Three.js from `assets/chip-module.webp`, with a drop-in assembly intro (Projects page)
- `src/components/ArchitectureStack.tsx` — CSS 3D exploded view of the architecture layers (Projects page)
- `src/components/AcceleratorScene.tsx` — the earlier graphics-card concept model, used only by the parked full Projects page
- `src/components/FlickerGrid.tsx` — home CTA canvas treatment
- `src/styles.css` — global design system, motion, accessibility, and responsive layouts
- `assets/logo-mark.png`, `assets/logo-plate.png`, and `assets/dog-run-cycle-white.png` — supplied brand art and the generated hero run cycle

## Design system

Keep pages quiet: a headline, the real content, and a visual. No section numbers, kicker labels, or caption text.

- `Sheet` (`src/components/Sheet.tsx`): a section with a heading, its content, and an optional full-width `wide` visual. Sections are separated by a single hairline.
- `SpecRows`: ruled rows (title, then detail) instead of boxed card grids.
- `Figure`: a plain panel for illustrations.
- `ChipSpecs`: the chip's public spec as a ruled table (Projects hero). A `null` value renders redacted.
- Buttons (`.fx-button`): solid Aggie maroon with one cut corner. `.is-ghost` is the hairline secondary.
- Type: Archivo with its width axis opened up for headlines (`--stretch-display`, `--stretch-heading`). Sizes come from the `--fs-*` tokens.

## Editing content

Copy is centralized in `src/data/site.ts`. Update that file before changing page markup. No sponsor, officer, fabrication-node, performance, or tapeout claims are encoded in the default content.

### Placeholders to replace before launch

`contact` at the top of `src/data/site.ts` holds three destinations that are **not yet real**:

| Field | Current placeholder | Used by |
| --- | --- | --- |
| `email` | `revsilicon@tamu.edu` | footer, Join page, Sponsor page |
| `instagram.url` / `linkedin.url` | `.../revsilicon` | footer, Sponsor page |
| `resources` | `https://github.com/revsilicon` | Join page "resource repo" link |

The Join page "Apply here" button stays disabled until the application form exists. Switch it to a linked `<a>` when the form is ready, and update the `FORM OPENS FALL 2026` status line beneath it.

## The process diagrams

`src/components/ProcessFlow.tsx` draws six SVG stages that follow the standard digital ASIC flow: architecture → RTL → verification → synthesis → physical design → signoff and tapeout. Each stage is a plain `<g>` of primitives sharing the arrowhead markers defined once in `StageDefs`. Stage copy lives in `site.process`; the artwork array is index-matched to it, so adding a stage requires adding both.

The tapeout package embeds the Rev mark through `markImageProps()` in `src/logoMark.ts`, which crops the logo plate down to Reveille alone so it can be dropped into any square. `MARK_CROP` is measured off the source art; if the logo file is ever replaced, remeasure it.

## Copy rules

No em dashes or en dashes anywhere in the copy. Use a period, a colon, or a comma.

## Replacing the accelerator

The Projects centerpiece is the module assembled in `buildModule()` inside `src/components/ChipScene.tsx`. Parts are laid out in `LAYOUT` using the pixel coordinates of `assets/chip-module.webp`, so the model stays in register with that render. It intentionally avoids implying a final board specification.

To replace it with an approved production model:

1. Put an optimized `.glb` model in `public/models/`.
2. Replace `buildModule()` with a `GLTFLoader` load path.
3. Preserve the existing camera fit, drag-to-tilt, pointer lighting, visibility pause, pixel-ratio cap, reduced-motion behavior, and the `chip-module.webp` fallback.
4. Keep the model lazy-loaded from `ProjectsPage.tsx` so it does not block the first text paint.

## Accessibility and performance

- Semantic landmarks, headings, labels, and keyboard focus are included; every diagram carries an `aria-label`.
- Motion is disabled or reduced under `prefers-reduced-motion: reduce`, including animation delays.
- The Three.js scene is lazy-loaded and only on the Projects route.
- WebGL scenes cap device pixel ratio, pause offscreen, and include static fallbacks.

## Screenshots

- `screenshots/home-desktop.png`
- `screenshots/home-mobile.png`

These are generated from the local development build and should be refreshed after material visual changes.
