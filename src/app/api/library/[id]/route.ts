import { libraryService } from '@/lib/library/LibraryService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = libraryService.getById(id);
  if (!entry) {
    return Response.json(
      { error: { code: 'LIBRARY_NOT_FOUND', message: `Library entry "${id}" not found` } },
      { status: 404 }
    );
  }
  return Response.json({ entry });
}
