export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", time: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
