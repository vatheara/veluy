import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: 'file:./src/lib/db/local.db',
  },
  verbose: true,
  strict: true,
});
