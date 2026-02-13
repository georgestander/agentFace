# Repository Guidelines

## Project Structure & Module Organization
- `src/worker.tsx`: Cloudflare Worker app entry and route wiring.
- `src/client.tsx`: client bootstrap/hydration.
- `src/app/pages`: page-level components (currently `Home.tsx`).
- `src/app/components`: shared UI primitives (`Chat.tsx`, `ChatBubble.tsx`, `UIBlock.tsx`, etc.).
- `src/app/context`: React context providers (`ChatContext`, `PerformanceContext`).
- `src/app/agent`: agent integration, streaming handlers/parsers, and prompt logic.
- `src/app/catalog`: UI block schema and catalog renderer for `json:ui` payloads.
- `src/app/tools`: tool registry, tool definitions, and renderer implementations used by OpenRouter tool-calling.
- `public/`: static assets (keep lightweight and cacheable).
- Root config: `vite.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `package.json`, `.dev.vars`.

## Build, Test, and Development Commands
- `pnpm install` (or `npm install`): install dependencies.
- `pnpm dev` (or `pnpm run dev`): run local Vite dev server at `http://localhost:5173`.
- `pnpm build` (or `pnpm run build`): production build validation.
- `pnpm release` (or `pnpm run release`): build and deploy via Wrangler.
- `pnpm generate` (or `pnpm run generate`): regenerate Wrangler/Workers types.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled.
- Formatting in existing code: 2-space indentation, semicolons, double quotes.
- Use functional React components and explicit prop types.
- Naming:
  - PascalCase for React component files (`ProjectCard.tsx`).
  - kebab-case for utility/domain modules (`parse-response.ts`).
- Prefer `@/` path alias imports for app-local modules.
- Validate untrusted model/UI output with Zod schemas before rendering.
- Keep streaming parsing and UI rendering separate from route handlers.

## Testing Guidelines
- No automated `test` script is configured yet.
- Minimum verification for every change:
  - `pnpm build` must pass.
  - Manual smoke test in `pnpm dev`:
    - send a chat message,
    - confirm streaming text,
    - confirm `json:ui` blocks render safely,
    - confirm tool-driven `json` payloads render via `src/app/tools` paths.
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
