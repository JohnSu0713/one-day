import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export function plaidClient() {
  const clientID = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV ?? "sandbox";
  const host = PlaidEnvironments[env as keyof typeof PlaidEnvironments];
  if (!clientID || !secret || !host) return null;
  return new PlaidApi(new Configuration({ basePath: host, baseOptions: { headers: { "PLAID-CLIENT-ID": clientID, "PLAID-SECRET": secret } } }));
}

