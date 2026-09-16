// Builds a tenant's own database connection string from its database name.
// `TENANT_DB_URL_TEMPLATE` holds everything but the database name itself,
// with a `{dbName}` placeholder, e.g.:
//   postgresql://postgres:postgres@127.0.0.1:5432/{dbName}?schema=public
// Kept in one place because both provisioning (creating + migrating a new
// tenant database) and TenantPrismaFactory (connecting to an existing one
// per request) need to build the exact same URL shape from a dbName.
export function buildTenantDatabaseUrl(dbName: string): string {
  const template = process.env.TENANT_DB_URL_TEMPLATE;
  if (!template) {
    throw new Error('TENANT_DB_URL_TEMPLATE is not set');
  }
  if (!template.includes('{dbName}')) {
    throw new Error('TENANT_DB_URL_TEMPLATE must contain a {dbName} placeholder');
  }
  return template.replace('{dbName}', dbName);
}

// Postgres database names: keep this conservative (lowercase, digits,
// underscore) since it's interpolated directly into `CREATE DATABASE` and
// into connection strings — no user input ever reaches this function
// un-derived (it's built from a tenant id, never typed by anyone), but
// treat it as untrusted anyway.
const SAFE_DB_NAME = /^[a-z][a-z0-9_]{0,62}$/;

export function tenantDbNameFor(tenantId: string): string {
  const sanitized = tenantId.replace(/-/g, '').toLowerCase();
  const dbName = `tenant_${sanitized}`;
  if (!SAFE_DB_NAME.test(dbName)) {
    throw new Error(`Generated database name "${dbName}" is not a safe Postgres identifier`);
  }
  return dbName;
}
