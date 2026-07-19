import { osModuleService } from '@/lib/os-modules/OSModuleService';
import { integrationService } from '@/lib/integrations/IntegrationService';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function OSModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = osModuleService.getBySlug(slug.toUpperCase());
  if (!mod) notFound();

  const map = await integrationService.getMap(mod.slug).catch(() => ({ inbound: [], outbound: [] }));

  return (
    <div className="max-w-2xl">
      <Link href="/os-modules" className="text-gray-400 text-sm hover:text-white mb-6 inline-block">← OS Modules</Link>
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-gray-500 text-sm">{mod.slug}</span>
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{mod.cluster}</span>
      </div>
      <h1 className="text-2xl font-bold mb-4">{mod.title}</h1>
      <p className="text-gray-300 mb-8">{mod.description}</p>

      {mod.linkedPillarCodes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Linked Pillars</h2>
          <div className="flex flex-wrap gap-2">
            {mod.linkedPillarCodes.map((c) => (
              <Link key={c} href={`/pillars/${c}`} className="text-xs font-mono bg-gray-800 px-2 py-1 rounded hover:bg-gray-700">{c}</Link>
            ))}
          </div>
        </div>
      )}

      {map.outbound.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Outbound Integrations ({map.outbound.length})</h2>
          <div className="flex flex-wrap gap-2">
            {map.outbound.map((i) => i.targetSlugs.map((t) => (
              <Link key={`${i.id}-${t}`} href={`/os-modules/${t}`} className="text-xs font-mono bg-gray-800 px-2 py-1 rounded hover:bg-gray-700">{t}</Link>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}
