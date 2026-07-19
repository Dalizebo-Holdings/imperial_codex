import { integrationService } from '@/lib/integrations/IntegrationService';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const map = await integrationService.getMap(slug.toUpperCase());
    return Response.json({ map });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'INTEGRATION_REGISTRY_NOT_LOADED') {
      return Response.json({ error: e }, { status: 503 });
    }
    return Response.json({ error: e }, { status: 408 });
  }
}
