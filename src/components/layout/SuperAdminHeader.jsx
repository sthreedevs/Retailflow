'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button.jsx';

export function SuperAdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  const navItems = [
    { label: 'Overview', href: '/superadmin' },
    { label: 'Stores & Tenants', href: '/superadmin/tenants' },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="font-bold tracking-tight text-neutral-100 text-sm">
              RetailFlow <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">SUPERADMIN</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/superadmin/tenants/new">
            <Button size="sm" variant="default" className="text-xs h-7">
              + New Tenant
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="text-xs text-neutral-400 hover:text-neutral-200 h-7"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
