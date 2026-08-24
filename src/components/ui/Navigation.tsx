'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/codex', label: 'Codex' },
    { href: '/agents', label: 'Agents' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block px-4 py-2 rounded ${
            pathname.startsWith(item.href)
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
