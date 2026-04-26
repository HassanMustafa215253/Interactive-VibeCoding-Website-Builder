# Selection-Based AI Website Builder

Production-style Next.js prototype for generating a website, selecting exact UI elements, and applying scoped AI edits only to the selected node.

## Features

- Prompt-to-website generation (full HTML/CSS document)
- Live preview in sandboxed iframe
- Element selection with visual highlight
- Mapping: UI element -> data-ai-id -> source snippet
- Scoped AI editing engine (selected snippet + local context + strict constraints)
- Safe patch application by `data-ai-id`
- Instant re-render after each edit
- Undo/Redo and version timeline
- Explain selected element

## Architecture

- `Code Generator`
  - `POST /api/ai` mode `generate`
  - Generates full HTML and injects `data-ai-id` markers for selectable nodes
- `Live Renderer`
  - `PreviewFrame` renders HTML in `iframe sandbox="allow-scripts"`
  - Injected bridge script handles click capture and highlight
- `Selection Manager`
  - Receives iframe postMessage payload with:
    - `id`, `tagName`, `snippet`, `parentSnippet`
- `AI Editor`
  - `POST /api/ai` mode `edit`
  - Prompt includes only selected snippet + minimal parent context + user instruction
  - AI constrained to return updated snippet only
- `Patch Applier`
  - Finds selected node by `data-ai-id`
  - Replaces only that element with returned snippet
  - Preserves identity and blocks out-of-scope changes

## How Selection -> AI -> Patch Works

1. User clicks element in preview iframe.
2. Bridge script finds closest `[data-ai-id]` and sends snippet to app.
3. User submits scoped instruction.
4. App calls `/api/ai` with:
   - selected snippet
   - parent snippet
   - instruction
   - full document (available for validation/future expansion)
5. API returns only updated snippet.
6. Client applies snippet by exact `data-ai-id`.
7. Preview re-renders and highlights the changed element.

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Optional: add an AI provider key for real model edits/generation:

```bash
# .env.local
# DigitalOcean (preferred if DIGITALOCEAN_API_KEY is present)
DIGITALOCEAN_API_KEY=your_digitalocean_key_here
# Optional override; defaults to DigitalOcean OpenAI-compatible endpoint
# DIGITALOCEAN_BASE_URL=https://api.digitalocean.com/v2/gen-ai/openai
# Set to a model available in your DigitalOcean account
DIGITALOCEAN_MODEL=your_model_name

# OpenAI fallback (used when DIGITALOCEAN_API_KEY is not set)
# OPENAI_API_KEY=your_openai_key_here
# OPENAI_MODEL=gpt-4o-mini
```

Without a provider key, app uses local deterministic fallback generator/editor.

3. Start dev server:

```bash
npm run dev
```

Open http://localhost:3000

## Demo Flow

1. Enter prompt: `Bold landing page for an AI travel startup` -> Generate.
2. Click CTA button in preview.
3. Instruction: `make this button rounded and blue` -> Apply to Selected.
4. Observe only selected button changes.
5. Use Undo/Redo.
6. Click Explain This Element for design-role summary.

## Project Structure

```text
.
|-- package.json
|-- next.config.ts
|-- tsconfig.json
|-- src
|   |-- app
|   |   |-- api/ai/route.ts
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components
|   |   `-- PreviewFrame.tsx
|   |-- lib
|   |   |-- code-utils.ts
|   |   |-- id.ts
|   |   `-- templates.ts
|   `-- types
|       `-- builder.ts
```
