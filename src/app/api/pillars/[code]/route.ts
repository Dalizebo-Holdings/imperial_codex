import { pillarService } from '@/lib/pillars/PillarService';

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = pillarService.getByCodeOrError(code);
  if ('error' in result) {
    const status = result.error.code === 'PILLAR_CODE_OUT_OF_RANGE' ? 400 : 404;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ pillar: result.pillar });
}
