import { libraryService } from '@/lib/library/LibraryService';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const slug = request.nextUrl.searchParams.get('slug');

  if (query) {
    try {
      const results = await libraryService.search(query);
      return Response.json({ results });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      return Response.json(
        { error: { code: e.code ?? 'LIBRARY_SEARCH_TIMEOUT', message: e.message ?? 'Search timed out' } },
        { status: 408 }
      );
    }
  }

  if (slug) {
    return Response.json({ entries: libraryService.findBySlug(slug) });
  }

  return Response.json({ entries: libraryService.getAll() });
}
