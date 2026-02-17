import { buildIntroCopy } from "./system-prompt";

/**
 * GET /api/intro
 *
 * Returns dynamic intro copy derived from system-prompt rules.
 */
export function introHandler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const nonce = url.searchParams.get("nonce") || undefined;
  const avoidKey = url.searchParams.get("avoid") || undefined;
  const intro = buildIntroCopy({ nonce, avoidKey });

  return new Response(JSON.stringify(intro), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
