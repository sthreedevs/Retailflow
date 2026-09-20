import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service.js';
import { AuditService } from '@/services/audit.service.js';
import { createSessionToken, getSessionCookieOptions } from '@/lib/session.js';
import { loginSchema } from '@/schemas/auth.schema.js';
import { assertRateLimit, getClientIp } from '@/lib/rate-limiter.js';
import { handleApiError } from '@/lib/errors.js';

export async function POST(request) {
  const clientIp = getClientIp(request);
  let requestEmail = '';

  try {
    // Sliding window rate limit: 10 attempts per minute per IP
    assertRateLimit(`login:${clientIp}`, {
      limit: 10,
      windowMs: 60000,
      message: 'Too many login attempts. Please wait 1 minute before trying again.',
    });

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    requestEmail = email;

    const user = await AuthService.authenticateUser(email, password);
    const token = await createSessionToken(user);

    // Audit log successful authentication
    AuditService.logAction(
      'AUTH_LOGIN_SUCCESS',
      user,
      user.tenantId,
      { clientIp }
    ).catch(() => {});

    const response = NextResponse.json({
      success: true,
      user,
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set({
      ...cookieOpts,
      value: token,
    });

    return response;
  } catch (error) {
    if (requestEmail) {
      AuditService.logAction(
        'AUTH_LOGIN_FAILURE',
        { userId: 'anonymous', email: requestEmail, role: 'ANONYMOUS' },
        null,
        { clientIp, reason: error?.message || 'Authentication failed' }
      ).catch(() => {});
    }

    return handleApiError(error, 'Authentication failed.');
  }
}
