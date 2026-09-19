import { NextResponse } from "next/server";
import { Products, CountryCode } from "plaid";
import { plaidClient } from "@/lib/plaid";

export async function POST() {
  const client = plaidClient();
  if (!client) return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  try {
    const response = await client.linkTokenCreate({ user: { client_user_id: crypto.randomUUID() }, client_name: "One Day", products: [Products.Transactions], country_codes: [CountryCode.Us], language: "en" });
    return NextResponse.json({ link_token: response.data.link_token });
  } catch { return NextResponse.json({ error: "Unable to start Plaid Link" }, { status: 502 }); }
}

