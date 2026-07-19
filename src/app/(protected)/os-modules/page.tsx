import { osModuleService } from '@/lib/os-modules/OSModuleService';
import Link from 'next/link';

export default function OSModulesPage() {
  const grouped = osModuleService.getAllGrouped();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">36 OS Modules</h1>
      <p className="text-gray-400 text-sm mb-8">The primary decision framework</p>
      {Object.entries(grouped).map(([cluster, modules]) => (
        <section key={cluster} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-800 pb-2">{cluster}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((m) => (
              <Link
                key={m.slug}
                href={`/os-modules/${m.slug}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
              >
                <span className="text-xs font-mono text-gray-500">{m.slug}</span>
                <p className="text-sm font-medium text-white mt-1">{m.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
