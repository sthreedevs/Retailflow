import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session.js';

export async function POST(request) {
  const acceptHeader = request.headers.get('accept') || '';
  const contentType = request.headers.get('content-type') || '';
  const isApiCall =
    (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) ||
    contentType.includes('application/json');

  if (isApiCall) {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  const redirectUrl = new URL('/', request.url);
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function GET(request) {
  const redirectUrl = new URL('/', request.url);
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

