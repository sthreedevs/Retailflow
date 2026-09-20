import { SignJWT, jwtVerify } from 'jose';

const DEFAULT_AUTH_SECRET = 'retail-super-secret-development-key-change-in-production';

function getJwtSecret() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;

  if (isProduction && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === DEFAULT_AUTH_SECRET)) {
    console.warn(
      '[SECURITY WARNING] Insecure default AUTH_SECRET is being used in production for invoice tokens.'
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Creates a tamper-proof signed JWT token for public invoice access.
 * Valid for 90 days.
 * @param {object} params
 * @param {string} params.tenantId
 * @param {string} params.saleId
 * @param {string} params.invoiceNumber
 * @returns {Promise<string>}
 */
export async function createInvoiceAccessToken({ tenantId, saleId, invoiceNumber }) {
  if (!tenantId || !saleId || !invoiceNumber) {
    throw new Error('tenantId, saleId, and invoiceNumber are required to create invoice access token');
  }

  const secret = getJwtSecret();
  return new SignJWT({
    tenantId: String(tenantId),
    saleId: String(saleId),
    invoiceNumber: String(invoiceNumber),
    type: 'INVOICE_ACCESS',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(secret);
}

/**
 * Cryptographically verifies an invoice access token and returns payload.
 * Returns null if token is invalid or expired.
 * @param {string} token
 * @returns {Promise<{ tenantId: string, saleId: string, invoiceNumber: string } | null>}
 */
export async function verifyInvoiceAccessToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== 'INVOICE_ACCESS') {
      return null;
    }
    return {
      tenantId: payload.tenantId,
      saleId: payload.saleId,
      invoiceNumber: payload.invoiceNumber,
    };
  } catch {
    return null;
  }
}
