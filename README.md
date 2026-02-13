# Agent Face — Phase 1

An AI agent that represents George through conversation and dynamically renders UI components.

## Setup

```bash
cd agent-face
pnpm install    # or npm install

# Add your OpenRouter API key to .dev.vars
# (already created — just replace the placeholder)
echo "OPENROUTER_API_KEY=sk-or-..." > .dev.vars

# Optional: override model/provider locally
# Format is "<provider>/<model>"
# Example: AI_MODEL=openai/gpt-4o
echo "minimax/minimax-m2.5" >> .dev.vars

# Start dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## How it works

1. Visitor lands on a chat interface with starter prompts
2. Messages POST to `/api/chat` → forwarded to OpenRouter with streaming
3. Agent responds with mixed text and `json:ui` fenced blocks
4. Client parses the stream, renders text as chat bubbles and UI blocks as React components
5. Choice buttons send their value as new user messages

## ASCII face tool

### Zero-command version (recommended)

No setup needed. Open this file in any browser and use it instantly:

```text
scripts/ascii-face.html
```

1. Double-click `scripts/ascii-face.html` in Finder/Explorer, **or** in your terminal run: `open scripts/ascii-face.html` (macOS) / `start scripts/ascii-face.html` (Windows) / `xdg-open scripts/ascii-face.html` (Linux)
2. Drop a photo or use the file picker
3. Click **Generate ASCII**
4. Copy or download the result from the UI

No Python, no Node packages, and no virtual environment (`venv`) are required for this version.

Use the local toolkit to convert a photo of your face into ASCII text.

```bash
cd /Users/georgestander/dev/personal/site_with_soul/agent-face
python scripts/ascii-face.py ./path/to/your/face.jpg --width 120
```

Useful options:

- `--width` — character width (columns)
- `--chars` — character ramp from lightest to darkest (default: ` .:-=+*#%@`)
- `--invert` — invert lightness-to-character mapping
- `--scale` — terminal aspect ratio tuning (default: `0.55`)
- `--output` / `-o` — write to a file instead of stdout

If Pillow is not installed:

```bash
pip install Pillow
```

## Environment

- `OPENROUTER_API_KEY` — required. For local dev, set in `.dev.vars`. For production, use `npx wrangler secret put OPENROUTER_API_KEY`.
- `AI_MODEL` — optional, defaults to `anthropic/claude-sonnet-4` (set in `wrangler.jsonc` for deploy).  
  You can also set a local override in `.dev.vars` (same format): `AI_MODEL=<provider>/<model>`.

## Stack

- **RedwoodSDK** — React on Cloudflare Workers (SSR + RSC)
- **OpenRouter** — model-agnostic AI API
- **Zod** — runtime validation of agent UI output
- **Tailwind CSS** — styling (CDN for Phase 1)

## Deploy

```bash
pnpm run release
```
