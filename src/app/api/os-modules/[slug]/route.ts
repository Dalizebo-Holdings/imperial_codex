import { osModuleService } from '@/lib/os-modules/OSModuleService';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = osModuleService.getBySlug(slug.toUpperCase());
  if (!mod) {
    return Response.json(
      { error: { code: 'OS_MODULE_NOT_FOUND', message: `OS Module "${slug}" not found` } },
      { status: 404 }
    );
  }
  return Response.json({ module: mod });
}
