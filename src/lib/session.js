import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'retail_session';
const DEFAULT_AUTH_SECRET = 'retail-super-secret-development-key-change-in-production';

function getJwtSecret() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;

  if (isProduction && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === DEFAULT_AUTH_SECRET)) {
    console.warn(
      '[SECURITY WARNING] Insecure default AUTH_SECRET is being used in production. Configure a strong secret in environment variables.'
    );
  }
  if (secret.length < 32) {
    console.warn(
      '[SECURITY WARNING] AUTH_SECRET should be at least 32 characters long for secure HS256 JWT signing.'
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed JWT session token valid for 7 days
 * @param {object} payload
 * @returns {Promise<string>}
 */
export async function createSessionToken(payload) {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the decoded payload.
 * Returns null if token is invalid or expired.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for the session cookie
 */
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}

/**
 * Extracts and verifies session payload from an incoming Request
 * Supports both cookies (browser) and Authorization: Bearer <token> (API clients/scripts)
 * @param {Request} request
 * @returns {Promise<object|null>}
 */
export async function getSessionFromRequest(request) {
  if (!request) return null;

  let token = null;

  // 1. Check Cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    token = cookies[SESSION_COOKIE_NAME];
  }

  // 2. Fallback to Authorization: Bearer header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
