import { pillarService } from '@/lib/pillars/PillarService';
import Link from 'next/link';

export default function PillarsPage() {
  const pillars = pillarService.getAll();
  const grouped = pillars.reduce<Record<string, typeof pillars>>((acc, p) => {
    (acc[p.cluster] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">207 Strategic Pillars</h1>
      <p className="text-gray-400 text-sm mb-8">The foundational laws of Dalizebo Holdings</p>
      {Object.entries(grouped).map(([cluster, clusterPillars]) => (
        <section key={cluster} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-800 pb-2">{cluster}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clusterPillars.map((p) => (
              <Link
                key={p.code}
                href={`/pillars/${p.code}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
              >
                <span className="text-xs text-gray-500 font-mono">{p.code}</span>
                <p className="text-sm font-medium text-white mt-1">{p.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
