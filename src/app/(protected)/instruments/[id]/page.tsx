import { getById } from '@/lib/instruments/InstrumentArchive';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function InstrumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const instrument = await getById(id).catch(() => null);
  if (!instrument) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/instruments" className="text-gray-400 text-sm hover:text-white mb-6 inline-block">← Instruments</Link>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-mono text-gray-500">{instrument.id}</span>
        <span className="text-xs text-gray-400">{instrument.generatedAt}</span>
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{instrument.generatedBy}</span>
      </div>
      <h1 className="text-2xl font-bold mb-8">{instrument.title}</h1>
      <div className="space-y-8">
        {instrument.sections.map((s) => (
          <section key={s.label}>
            <h2 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-2">{s.label}</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
