import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-md w-full border border-neutral-800 rounded-xl p-8 bg-neutral-900/60 shadow-2xl backdrop-blur-sm space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Phase 1 Foundation Ready
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            RetailFlow SaaS
          </h1>
          <p className="text-sm text-neutral-400">
            Multi-Tenant Retail Inventory &amp; POS Management Platform. Database-per-tenant architecture with dynamic connection caching.
          </p>
        </div>

        <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs text-neutral-400 font-mono">
          <div className="flex justify-between py-1">
            <span>Platform Database</span>
            <span className="text-emerald-400 font-semibold">platform</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Tenant Architecture</span>
            <span className="text-neutral-200">tenant_&lt;tenantId&gt;</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Stack</span>
            <span className="text-neutral-200">Next.js App Router (JS/JSX)</span>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Button variant="default" className="w-full">
            System Operational
          </Button>
        </div>
      </div>
    </main>
  );
}
