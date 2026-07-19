import { osModuleService } from '@/lib/os-modules/OSModuleService';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (query) {
    try {
      const results = await osModuleService.search(query);
      return Response.json({ results });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      return Response.json(
        { error: { code: e.code ?? 'OS_MODULE_SEARCH_TIMEOUT', message: e.message ?? 'Search timed out' } },
        { status: 408 }
      );
    }
  }
  return Response.json({ grouped: osModuleService.getAllGrouped() });
}
