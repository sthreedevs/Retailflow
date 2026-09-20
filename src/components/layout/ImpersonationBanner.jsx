'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button.jsx';

export function ImpersonationBanner({ storeName, tenantId, adminEmail }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  async function handleExit() {
    setExiting(true);
    try {
      const res = await fetch('/api/platform/exit-impersonation', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/superadmin/tenants');
      }
    } catch {
      router.push('/superadmin/tenants');
    } finally {
      setExiting(false);
    }
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-semibold uppercase tracking-wider text-[11px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
          Superadmin Impersonation
        </span>
        <span className="text-neutral-300">
          Viewing store: <strong className="text-amber-300">{storeName || tenantId}</strong> ({tenantId}) &bull; Admin: <span className="font-mono text-neutral-400">{adminEmail}</span>
        </span>
      </div>

      <Button
        size="xs"
        variant="outline"
        onClick={handleExit}
        disabled={exiting}
        className="border-amber-500/40 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100 h-6 text-xs"
      >
        {exiting ? 'Exiting...' : 'Exit to Superadmin'}
      </Button>
    </div>
  );
}
