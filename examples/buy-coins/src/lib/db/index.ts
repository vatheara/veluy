import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Ensure the db directory exists
    const dbDir = path.join(process.cwd(), 'src/lib/db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'local.db');
    
    // Create libsql client for local SQLite file
    const client = createClient({
      url: `file:${dbPath}`
    });
    
    dbInstance = drizzle(client, { schema });
    
    // Run migrations on startup in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const migrationsPath = path.join(process.cwd(), 'src/lib/db/migrations');
        if (fs.existsSync(migrationsPath)) {
          migrate(dbInstance, { migrationsFolder: migrationsPath });
          console.log('✅ Database migrations completed');
        } else {
          console.warn('⚠️ Migrations folder not found, skipping migrations');
        }
      } catch (error) {
        console.warn('⚠️ Database migrations failed:', error);
      }
    }
    
    console.log('✅ Database connected successfully');
    return dbInstance;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

export const getDb = () => initializeDatabase();
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = initializeDatabase();
    return database[prop as keyof typeof database];
  }
});

export { schema };
export type { User, NewUser, Transaction, NewTransaction } from './schema';

