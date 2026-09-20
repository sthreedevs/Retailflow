import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session.js';
import { USER_ROLES } from '@/lib/constants.js';
import { SuperAdminHeader } from '@/components/layout/SuperAdminHeader.jsx';

export const metadata = {
  title: 'Platform Superadmin — RetailFlow',
  description: 'Manage SaaS tenants, provisioning, and platform statistics',
};

export default async function SuperAdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !session.userId) {
    redirect('/login');
  }

  if (session.role !== USER_ROLES.SUPER_ADMIN) {
    redirect('/tenant/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <SuperAdminHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
