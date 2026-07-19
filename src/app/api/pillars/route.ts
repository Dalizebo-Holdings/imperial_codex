import { pillarService } from '@/lib/pillars/PillarService';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (query) {
    try {
      const results = await pillarService.search(query);
      return Response.json({ results });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      return Response.json(
        { error: { code: e.code ?? 'PILLAR_SEARCH_TIMEOUT', message: e.message ?? 'Search timed out' } },
        { status: 408 }
      );
    }
  }
  return Response.json({ pillars: pillarService.getAll() });
}
