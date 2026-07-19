import { Navigation } from '@/components/ui/Navigation';
import { SystemStatusBar } from '@/components/ui/SystemStatusBar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SystemStatusBar />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
