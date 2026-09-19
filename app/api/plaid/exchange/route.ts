import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import type { AccountKind } from "@/lib/model";

const kindMap: Record<string, AccountKind> = { depository: "cash", investment: "investment", loan: "loan", credit: "credit" };

export async function POST(request: NextRequest) {
  const client = plaidClient();
  if (!client) return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  try {
    const body = await request.json() as { publicToken?: string };
    if (!body.publicToken) return NextResponse.json({ error: "Missing public token" }, { status: 400 });
    const exchanged = await client.itemPublicTokenExchange({ public_token: body.publicToken });
    const accessToken = exchanged.data.access_token;
    const balances = await client.accountsBalanceGet({ access_token: accessToken });
    const now = new Date().toISOString();
    const accounts = balances.data.accounts.map((account) => ({ id: `plaid-${account.account_id}`, name: account.name, kind: kindMap[account.type] ?? "cash", source: "plaid" as const, balance: Math.abs(account.balances.current ?? account.balances.available ?? 0), updatedAt: now }));
    // This MVP deliberately does not persist accessToken. Add encrypted server-side storage before background sync.
    return NextResponse.json({ accounts });
  } catch { return NextResponse.json({ error: "Unable to import Plaid accounts" }, { status: 502 }); }
}

