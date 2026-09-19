export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'imperial-codex',
    timestamp: new Date().toISOString(),
  });
}
