import { getByYear } from '@/lib/instruments/InstrumentArchive';
import Link from 'next/link';

export default async function InstrumentsPage() {
  const year = new Date().getUTCFullYear();
  const entries = await getByYear(year).catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Instrument Archive</h1>
      <p className="text-gray-400 text-sm mb-8">DH-RES instruments — {year}</p>
      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No instruments generated this year.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <Link
              key={e.id}
              href={`/instruments/${e.id}`}
              className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div>
                <span className="text-xs font-mono text-gray-500">{e.id}</span>
                <p className="text-sm font-medium text-white mt-0.5">{e.title}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>{e.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
