import { getByYear } from '@/lib/instruments/InstrumentArchive';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getUTCFullYear();

  try {
    const entries = await getByYear(year);
    return Response.json({ entries, year });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    return Response.json({ error: e }, { status: 503 });
  }
}
