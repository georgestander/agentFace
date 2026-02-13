# Repository Guidelines

## Project Structure & Module Organization
- `src/worker.tsx`: Cloudflare Worker app entry and route wiring.
- `src/client.tsx`: client bootstrap/hydration.
- `src/app/pages`: page-level components (currently `Home.tsx`).
- `src/app/components`: reusable UI/chat components (`Chat.tsx`, `ChatBubble.tsx`, `UIBlock.tsx`).
- `src/app/agent`: agent integration, streaming/parsing, and prompt logic.
- `src/app/catalog`: UI block schema + renderer catalog for `json:ui` payloads.
- `public/`: static assets (keep lightweight and cacheable).
- Root config: `vite.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `package.json`, `.dev.vars`.

## Build, Test, and Development Commands
- `pnpm install` (or `npm install`): install dependencies.
- `pnpm dev`: run local Vite dev server at `http://localhost:5173`.
- `pnpm build`: production build validation.
- `pnpm release`: build and deploy via Wrangler.
- `pnpm generate`: regenerate Wrangler/Workers types.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled.
- Formatting in existing code: 2-space indentation, semicolons, double quotes.
- Use functional React components and explicit prop types.
- Naming:
  - PascalCase for React component files (`ProjectCard.tsx`).
  - kebab-case for utility/domain modules (`parse-response.ts`).
- Prefer `@/` path alias imports for app-local modules.
- Validate untrusted model/UI output with Zod schemas before rendering.

## Testing Guidelines
- No automated `test` script is configured yet.
- Minimum verification for every change:
  - `pnpm build` must pass.
  - Manual smoke test in `pnpm dev`:
    - send a chat message,
    - confirm streaming text,
    - confirm `json:ui` blocks render safely.
- If you add tests, co-locate as `*.test.ts`/`*.test.tsx` near the feature and document the new command in `package.json`.

## Commit & Pull Request Guidelines
- This workspace snapshot does not include `.git` history; use Conventional Commit style by default (`feat:`, `fix:`, `docs:`, `refactor:`).
- Keep commit subjects imperative and concise (about 72 chars max).
- PRs should include:
  - clear summary and scope,
  - linked issue (if any),
  - verification steps run,
  - screenshots/GIFs for UI changes.

## Security & Configuration Tips
- Never commit real secrets (especially `OPENROUTER_API_KEY`).
- Local secrets go in `.dev.vars`; production secrets via `wrangler secret put`.
- If changing runtime vars (for example `AI_MODEL`), update `wrangler.jsonc` and mention it in the PR.
