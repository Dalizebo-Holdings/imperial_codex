import { getById } from '@/lib/instruments/InstrumentArchive';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const instrument = await getById(id);
    if (!instrument) {
      return Response.json(
        { error: { code: 'INSTRUMENT_NOT_FOUND', message: `Instrument "${id}" not found` } },
        { status: 404 }
      );
    }
    return Response.json({ instrument });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    return Response.json({ error: e }, { status: 503 });
  }
}
