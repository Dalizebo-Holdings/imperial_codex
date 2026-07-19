import { libraryService } from '@/lib/library/LibraryService';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function LibraryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = libraryService.getById(id);
  if (!entry) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/library" className="text-gray-400 text-sm hover:text-white mb-6 inline-block">← Library</Link>
      <span className="text-xs font-mono text-gray-500">{entry.id}</span>
      <h1 className="text-2xl font-bold mt-1 mb-4">{entry.title}</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {entry.osModuleSlugs.map((s) => (
          <Link key={s} href={`/os-modules/${s}`} className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded hover:bg-gray-700">{s}</Link>
        ))}
      </div>
      <p className="text-gray-300 leading-relaxed">{entry.body}</p>
    </div>
  );
}
