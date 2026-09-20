import { NextResponse } from 'next/server';
import { getPlatformConnection, PLATFORM_DB_NAME } from '@/db/mongodb.js';
import { TenantConnectionManager } from '@/db/tenant-manager.js';

export async function GET() {
  try {
    const platformConn = await getPlatformConnection();
    const isPlatformConnected = platformConn.readyState === 1;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: {
        database: PLATFORM_DB_NAME,
        connected: isPlatformConnected,
      },
      cachedTenantDatabases: TenantConnectionManager.getCachedDatabases(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database connection error',
      },
      { status: 503 }
    );
  }
}
