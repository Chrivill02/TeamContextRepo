import pg from 'pg';

// Supabase pooler (port 6543, transaction mode) is the right choice for serverless.
// Supabase signs its server certs with its own root CA, so we verify against that CA
// (SUPABASE_CA_CERT, PEM text) instead of disabling verification. The URL's `sslmode`
// would override our ssl options in node-pg, so we drop it.
export function createPool(connectionString, caCert) {
  if (!connectionString) throw new Error('POSTGRES_URL is required');
  if (!caCert) throw new Error('SUPABASE_CA_CERT is required (Supabase → Database settings → SSL → Download certificate)');
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return new pg.Pool({ connectionString: url.toString(), ssl: { ca: caCert, rejectUnauthorized: true }, max: 3 });
}
