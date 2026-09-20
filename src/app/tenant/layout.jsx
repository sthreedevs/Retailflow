import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session.js';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner.jsx';
import { USER_ROLES } from '@/lib/constants.js';

export const metadata = {
  title: 'Store Portal — RetailFlow',
};

export default async function TenantLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !session.userId) {
    redirect('/login');
  }

  // Superadmin without impersonation belongs in the superadmin portal
  if (session.role === USER_ROLES.SUPER_ADMIN && !session.impersonatedBy) {
    redirect('/superadmin');
  }

  const isImpersonating = Boolean(session?.impersonatedBy);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {isImpersonating && (
        <ImpersonationBanner
          storeName={session.storeName}
          tenantId={session.tenantId}
          adminEmail={session.impersonatedBy.email}
        />
      )}

      {/* Tenant Navigation Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <div>
                <span className="font-bold text-sm tracking-tight text-neutral-100">
                  {session?.storeName || 'Retail Store Portal'}
                </span>
                <span className="ml-2 font-mono text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                  {session?.tenantId || 'Store Context'}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/tenant/dashboard"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/tenant/products"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
              >
                Products
              </Link>
              <Link
                href="/tenant/inventory"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
              >
                Inventory
              </Link>
              <Link
                href="/tenant/inventory/movements"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
              >
                Movements
              </Link>
              <Link
                href="/tenant/pos"
                className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
              >
                POS Billing
              </Link>
              <Link
                href="/tenant/pos/bills"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
              >
                Bills
              </Link>
              {(session?.role === USER_ROLES.STORE_OWNER || session?.role === USER_ROLES.STORE_ADMIN) && (
                <Link
                  href="/tenant/staff"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
                >
                  Staff
                </Link>
              )}
              {(session?.role === USER_ROLES.STORE_OWNER || session?.role === USER_ROLES.STORE_ADMIN) && (
                <Link
                  href="/tenant/settings"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 transition-colors"
                >
                  Settings
                </Link>
              )}
              {(session?.role === USER_ROLES.STORE_OWNER || session?.role === USER_ROLES.STORE_ADMIN) && (
                <Link
                  href="/tenant/products/import"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                >
                  + Import CSV/Excel
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400 hidden sm:inline">
              Role: <strong className="text-neutral-200">{session?.role || 'User'}</strong>
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-neutral-400 hover:text-neutral-200 text-xs px-2.5 py-1 rounded border border-neutral-800 hover:bg-neutral-800 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
