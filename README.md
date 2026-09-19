# One Day

**Make someday a date.** One Day is a location-aware financial independence planner: connect or enter a financial picture, compare the life you want across cities, and see when work could become optional.

## What works today

- FIRE target and year projection using editable real return, withdrawal rate, contributions, and destination lifestyle cost
- Six curated destination starting points with responsive comparison views
- Hybrid accounts: manual entries plus Plaid Link balance import
- Local-first persistence for the plan and accounts
- Installable PWA metadata and responsive mobile navigation
- Strict TypeScript, unit tests, production build, and GitHub Actions CI

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run the full verification suite with:

```bash
npm run check
```

## Plaid setup

Copy `.env.example` to `.env.local` and add credentials from the Plaid dashboard:

```text
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
```

In sandbox, Plaid's test institution credentials can be used. The current MVP exchanges the public token server-side, imports current balances, and deliberately discards the access token. Background sync requires authentication and encrypted server-side token storage first.

## Calculation assumptions

- FIRE target = annual destination spending ÷ withdrawal rate
- Portfolio compounds once per year using a real (after-inflation) return
- Annual contributions are added after that year's growth
- Property, cash, and investments add to net worth; loans and credit subtract from it

City costs are editable planning estimates, not financial advice or live cost-of-living quotes.

