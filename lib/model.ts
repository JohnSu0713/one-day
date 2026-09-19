export type AccountKind = "cash" | "investment" | "retirement" | "property" | "loan" | "credit";
export type AccountSource = "manual" | "plaid";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  source: AccountSource;
  balance: number;
  updatedAt: string;
}

export interface Plan {
  age: number;
  annualContribution: number;
  realReturn: number;
  withdrawalRate: number;
  selectedCity: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  annualSpend: number;
  note: string;
  tags: string[];
  tone: string;
}

export const cities: City[] = [
  { id: "sendai", name: "Sendai", country: "Japan", annualSpend: 61000, note: "City comfort, with mountains and sea close by.", tags: ["Nature", "Transit", "Healthcare"], tone: "pine" },
  { id: "saku", name: "Saku", country: "Japan", annualSpend: 57000, note: "Cool, quiet highland living within reach of Tokyo.", tags: ["Dry climate", "Space", "Shinkansen"], tone: "clay" },
  { id: "taipei", name: "Taipei", country: "Taiwan", annualSpend: 68000, note: "Effortless daily life and the fastest way home.", tags: ["Healthcare", "Food", "Family"], tone: "ink" },
  { id: "fukuoka", name: "Fukuoka", country: "Japan", annualSpend: 64000, note: "Warm, compact, and remarkably well connected.", tags: ["Airport", "Food", "Mild winter"], tone: "sand" },
  { id: "seattle", name: "Seattle", country: "United States", annualSpend: 118000, note: "The life you know, with no relocation required.", tags: ["Career", "Nature", "Network"], tone: "moss" },
  { id: "honolulu", name: "Honolulu", country: "United States", annualSpend: 105000, note: "Island pace with a familiar healthcare system.", tags: ["Climate", "Ocean", "Asia access"], tone: "sea" },
];

export const defaultAccounts: Account[] = [
  { id: "demo-1", name: "Investments", kind: "investment", source: "manual", balance: 540000, updatedAt: new Date().toISOString() },
  { id: "demo-2", name: "Retirement", kind: "retirement", source: "manual", balance: 265000, updatedAt: new Date().toISOString() },
  { id: "demo-3", name: "Cash reserve", kind: "cash", source: "manual", balance: 55000, updatedAt: new Date().toISOString() },
];

export const defaultPlan: Plan = { age: 34, annualContribution: 135000, realReturn: 0.05, withdrawalRate: 0.035, selectedCity: "sendai" };

export function netWorth(accounts: Account[]) {
  return accounts.reduce((sum, account) => sum + (account.kind === "loan" || account.kind === "credit" ? -Math.abs(account.balance) : account.balance), 0);
}

export function projection(current: number, annual: number, rate: number, target: number, maxYears = 80) {
  if (current >= target) return 0;
  let value = current;
  for (let years = 1; years <= maxYears; years += 1) {
    value = value * (1 + rate) + annual;
    if (value >= target) return years;
  }
  return null;
}

export function currency(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(value);
}

