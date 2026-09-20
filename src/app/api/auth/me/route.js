import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: error?.message || 'Failed to resolve session.' },
      { status: 500 }
    );
  }
}
