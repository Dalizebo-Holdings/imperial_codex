import { libraryService } from '@/lib/library/LibraryService';
import Link from 'next/link';

export default function LibraryPage() {
  const entries = libraryService.getAll();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Imperial Library</h1>
      <p className="text-gray-400 text-sm mb-8">{entries.length} knowledge entries</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/library/${e.id}`}
            className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
          >
            <span className="text-xs font-mono text-gray-500">{e.id}</span>
            <p className="text-sm font-medium text-white mt-1">{e.title}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {e.osModuleSlugs.slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
