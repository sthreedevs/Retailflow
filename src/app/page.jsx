import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session.js';
import { USER_ROLES } from '@/lib/constants.js';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session?.userId) {
      if (session.role === USER_ROLES.SUPER_ADMIN && !session.impersonatedBy) {
        redirect('/superadmin');
      }
      redirect('/tenant/dashboard');
    }
  }

  redirect('/login');
}

