import { Client } from 'pg';

// Postgres error code for "database already exists" — see
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const DUPLICATE_DATABASE = '42P04';

// Creates a brand new, empty Postgres database using an admin connection
// (superuser / DB owner, connected to the `postgres` maintenance database —
// never the same connection as CONTROL_DATABASE_URL or any tenant's own
// DATABASE_URL). Idempotent: if the database already exists — e.g. a
// previous provisioning attempt got this far before failing later — this
// is a no-op rather than an error, so a retry can proceed straight to
// running migrations against it.
export async function createTenantDatabase(dbName: string): Promise<void> {
  const adminUrl = process.env.PROVISION_DB_ADMIN_URL;
  if (!adminUrl) {
    throw new Error('PROVISION_DB_ADMIN_URL is not set');
  }

  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    // Identifiers can't be parameterized in SQL — dbName is validated by
    // tenantDbNameFor()'s SAFE_DB_NAME check before it ever reaches here,
    // so this is a controlled, non-user-supplied value, not string-built
    // from request input.
    await client.query(`CREATE DATABASE "${dbName}"`);
  } catch (error) {
    if ((error as { code?: string }).code !== DUPLICATE_DATABASE) {
      throw error;
    }
    // Already exists — fine, treat as already-provisioned-this-far.
  } finally {
    await client.end();
  }
}
