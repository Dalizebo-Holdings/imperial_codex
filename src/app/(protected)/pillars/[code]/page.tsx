import { pillarService } from '@/lib/pillars/PillarService';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PillarDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = pillarService.getByCodeOrError(code);
  if ('error' in result) notFound();
  const { pillar } = result;

  return (
    <div className="max-w-2xl">
      <Link href="/pillars" className="text-gray-400 text-sm hover:text-white mb-6 inline-block">← Pillars</Link>
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-gray-500 text-sm">{pillar.code}</span>
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{pillar.cluster}</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">{pillar.title}</h1>
      <p className="text-gray-300 leading-relaxed">{pillar.body}</p>
    </div>
  );
}
