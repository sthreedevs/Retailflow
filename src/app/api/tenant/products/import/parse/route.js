import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { ImportParserService } from '@/services/import-parser.service.js';
import { assertRateLimit } from '@/lib/rate-limiter.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization
    if (user.role === USER_ROLES.CASHIER || user.role === USER_ROLES.STAFF) {
      throw new ForbiddenError('Only Store Owner or Store Admin can upload product catalogs.');
    }

    // Rate limit per tenant: 15 uploads per minute
    assertRateLimit(`import_parse:${tenantContext.tenantId}`, {
      limit: 15,
      windowMs: 60000,
      message: 'Too many file parse requests. Please wait a moment before uploading again.',
    });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      throw new ValidationError('Please select a valid CSV or Excel file to upload.');
    }

    // Strict file size check before reading into memory
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 10MB.`
      );
    }

    // Strict extension validation
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new ValidationError(
        `Unsupported file type ".${ext}". Please upload a file with .csv, .xlsx, or .xls extension.`
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { headers, rows, totalRows } = ImportParserService.parseBuffer(buffer, file.name);

    if (totalRows === 0) {
      throw new ValidationError('The uploaded file contains no data rows.');
    }

    const detectedMapping = ImportParserService.detectColumnMappings(headers);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: ext.toUpperCase(),
      totalRows,
      headers,
      detectedMapping,
      sampleRows: rows.slice(0, 10),
      allRows: rows,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to parse file.');
  }
}
