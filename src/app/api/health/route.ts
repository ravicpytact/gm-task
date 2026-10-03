// Container health check (nextjs-docker). Reports this server only, not the backend.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
