import mongoose from 'mongoose';
import { DatabaseConnectionError } from '../lib/errors.js';

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017';
export const PLATFORM_DB_NAME = 'platform';

// Ensure connection is preserved across Next.js dev hot-reloads
let cached = global.__mongoosePlatformCache;

if (!cached) {
  cached = global.__mongoosePlatformCache = { conn: null, promise: null };
}

/**
 * Returns the shared cluster connection URI
 */
export function getMongoUri() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  if (!uri) {
    throw new DatabaseConnectionError(PLATFORM_DB_NAME, 'MONGODB_URI is not defined.');
  }
  return uri;
}

/**
 * Connects to and returns the platform MongoDB database connection.
 * The platform database strictly uses `dbName: "platform"`.
 */
export async function getPlatformConnection() {
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = getMongoUri();
    const opts = {
      dbName: PLATFORM_DB_NAME,
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .createConnection(uri, opts)
      .asPromise()
      .then((conn) => {
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        throw new DatabaseConnectionError(PLATFORM_DB_NAME, err?.message || String(err));
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
