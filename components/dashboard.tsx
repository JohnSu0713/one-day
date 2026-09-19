"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { cities, currency, defaultAccounts, defaultPlan, netWorth, projection, type Account, type AccountKind, type Plan } from "@/lib/model";
import { Icon } from "./icons";
import { usePlaidLink } from "react-plaid-link";

type View = "plan" | "places" | "finances";

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const stored = localStorage.getItem(key); if (stored) setValue(JSON.parse(stored) as T); } catch { /* use safe defaults */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(value)); }, [key, ready, value]);
  return [value, setValue] as const;
}

export function Dashboard() {
  const [view, setView] = useState<View>("plan");
  const [plan, setPlan] = useStoredState<Plan>("one-day-plan-v1", defaultPlan);
  const [accounts, setAccounts] = useStoredState<Account[]>("one-day-accounts-v1", defaultAccounts);
  const [spending, setSpending] = useStoredState<Record<string, number>>("one-day-spending-v1", {});
  const [modal, setModal] = useState<"account" | "plaid" | null>(null);
  const selected = cities.find((city) => city.id === plan.selectedCity) ?? cities[0];
  const annualSpend = spending[selected.id] ?? selected.annualSpend;
  const target = annualSpend / plan.withdrawalRate;
  const worth = netWorth(accounts);
  const years = projection(worth, plan.annualContribution, plan.realReturn, target);
  const progress = Math.min(100, Math.max(0, (worth / target) * 100));

  const model = { selected, annualSpend, target, worth, years, progress };

  return <div className="shell">
    <Header onNavigate={setView} />
    <main>
      {view === "plan" && <PlanView model={model} plan={plan} setPlan={setPlan} spending={spending} setSpending={setSpending} onNavigate={setView} />}
      {view === "places" && <PlacesView plan={plan} setPlan={setPlan} spending={spending} worth={worth} />}
      {view === "finances" && <FinancesView accounts={accounts} worth={worth} onAdd={() => setModal("account")} onPlaid={() => setModal("plaid")} onRemove={(id) => setAccounts(accounts.filter((a) => a.id !== id))} />}
    </main>
    <BottomNav view={view} setView={setView} />
    {modal === "account" && <AccountModal onClose={() => setModal(null)} onSave={(account) => { setAccounts([...accounts, account]); setModal(null); }} />}
    {modal === "plaid" && <PlaidModal onClose={() => setModal(null)} onAccounts={(imported) => { setAccounts([...accounts.filter((a) => a.source !== "plaid"), ...imported]); setModal(null); }} />}
  </div>;
}

function Header({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <header className="topbar">
    <button className="wordmark" onClick={() => onNavigate("plan")} aria-label="One Day home"><span className="brand-mark">1</span><span>ONE DAY</span></button>
    <div className="top-actions"><span className="saved"><i /> Saved locally</span><button className="avatar" aria-label="Profile">JS</button></div>
  </header>;
}

function PlanView({ model, plan, setPlan, spending, setSpending, onNavigate }: { model: ReturnType<typeof getModel>; plan: Plan; setPlan: (plan: Plan) => void; spending: Record<string, number>; setSpending: (v: Record<string, number>) => void; onNavigate: (v: View) => void }) {
  const { selected, annualSpend, target, worth, years, progress } = model;
  return <>
    <section className="hero page-pad">
      <div className="eyebrow"><Icon name="spark" size={15} /> YOUR PATH TO ENOUGH</div>
      <h1>One day can<br />become <em>a date.</em></h1>
      <p className="hero-copy">See when work becomes optional—and where your life could take you next.</p>
      <div className="hero-grid">
        <div className="progress-wrap">
          <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{Math.round(progress)}%</strong><span>of your way there</span></div>
          </div>
          <p>At your current pace, independence could arrive in</p>
          <div className="date-row"><strong>{years === null ? "Beyond range" : `${new Date().getFullYear() + years}`}</strong><span>{years === null ? "Try a higher contribution" : `Age ${plan.age + years} · ${years} years away`}</span></div>
        </div>
        <div className="snapshot">
          <div className="snapshot-head"><span>PLAN SNAPSHOT</span><button onClick={() => onNavigate("finances")}>Edit finances <Icon name="arrow" size={14} /></button></div>
          <Metric label="Invested today" value={currency(worth)} note="Across all included accounts" />
          <Metric label="Annual additions" value={currency(plan.annualContribution)} note={`${currency(plan.annualContribution / 12)} each month`} />
          <Metric label={`Life in ${selected.name}`} value={`${currency(annualSpend)}/yr`} note={`Target ${currency(target, true)} at ${(plan.withdrawalRate * 100).toFixed(1)}%`} />
        </div>
      </div>
    </section>
    <section className="places-section page-pad">
      <div className="section-title"><div><span className="kicker">THE LIFE AFTER</span><h2>What if home were<br />somewhere else?</h2></div><button className="text-button" onClick={() => onNavigate("places")}>Explore all places <Icon name="arrow" size={16} /></button></div>
      <div className="cards-row">{cities.slice(0, 3).map((city, index) => {
        const spend = spending[city.id] ?? city.annualSpend;
        const cityTarget = spend / plan.withdrawalRate;
        const cityYears = projection(worth, plan.annualContribution, plan.realReturn, cityTarget);
        return <article className={`city-card ${city.tone} ${selected.id === city.id ? "selected" : ""}`} key={city.id} onClick={() => setPlan({ ...plan, selectedCity: city.id })}>
          <div className="city-number">0{index + 1}</div><div className="city-top"><span>{city.country}</span>{selected.id === city.id && <b>YOUR PLAN</b>}</div>
          <div className="city-body"><h3>{city.name}</h3><p>{city.note}</p><div className="tags">{city.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          <div className="city-foot"><div><span>FIRE AT</span><strong>{cityYears === null ? "—" : plan.age + cityYears}</strong></div><div><span>LIFESTYLE</span><strong>{currency(spend, true)}<small>/yr</small></strong></div><Icon name="arrow" /></div>
        </article>;
      })}</div>
    </section>
    <section className="scenario page-pad">
      <div><span className="kicker">A SMALL CHANGE, COMPOUNDED</span><h2>Make it sooner.</h2><p>Adjust the assumptions. Your timeline updates instantly—and stays on this device.</p></div>
      <div className="controls">
        <Range label="Annual additions" value={plan.annualContribution} min={20000} max={250000} step={5000} display={currency(plan.annualContribution)} onChange={(v) => setPlan({ ...plan, annualContribution: v })} />
        <Range label="Expected real return" value={plan.realReturn * 100} min={2} max={8} step={0.25} display={`${(plan.realReturn * 100).toFixed(2)}%`} onChange={(v) => setPlan({ ...plan, realReturn: v / 100 })} />
        <Range label={`${selected.name} lifestyle`} value={annualSpend} min={30000} max={150000} step={1000} display={`${currency(annualSpend)}/yr`} onChange={(v) => setSpending({ ...spending, [selected.id]: v })} />
      </div>
    </section>
  </>;
}

function getModel() { return { selected: cities[0], annualSpend: 0, target: 0, worth: 0, years: 0 as number | null, progress: 0 }; }

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Range({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) { return <label className="range"><span><b>{label}</b><strong>{display}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>; }

function PlacesView({ plan, setPlan, spending, worth }: { plan: Plan; setPlan: (p: Plan) => void; spending: Record<string, number>; worth: number }) {
  return <section className="subpage page-pad"><span className="kicker">DESTINATION EXPLORER</span><h1>Where could one day be?</h1><p className="lead">Compare the same financial life across places. Estimates are editable in your Plan.</p><div className="places-grid">{cities.map((city) => { const spend = spending[city.id] ?? city.annualSpend; const target = spend / plan.withdrawalRate; const years = projection(worth, plan.annualContribution, plan.realReturn, target); return <button key={city.id} className={`place-row ${plan.selectedCity === city.id ? "active" : ""}`} onClick={() => setPlan({ ...plan, selectedCity: city.id })}><div><span>{city.country}</span><h2>{city.name}</h2><p>{city.note}</p></div><div className="place-stat"><span>ESTIMATED FIRE</span><strong>{years === null ? "—" : `Age ${plan.age + years}`}</strong><small>{currency(spend)}/year</small></div></button>; })}</div></section>;
}

function FinancesView({ accounts, worth, onAdd, onPlaid, onRemove }: { accounts: Account[]; worth: number; onAdd: () => void; onPlaid: () => void; onRemove: (id: string) => void }) {
  const synced = accounts.filter((a) => a.source === "plaid").length;
  return <section className="subpage page-pad finances"><span className="kicker">YOUR FINANCIAL PICTURE</span><h1>{currency(worth)}</h1><p className="lead">Net worth included in your One Day plan.</p><div className="finance-actions"><button className="primary" onClick={onPlaid}>Connect an account</button><button className="secondary" onClick={onAdd}><Icon name="plus" size={17} /> Add manually</button></div><div className="data-quality"><div><span>DATA QUALITY</span><strong>{synced ? `${Math.round((synced / accounts.length) * 100)}% automatically synced` : "Manual profile"}</strong></div><span className="quality-pill">{accounts.length} accounts</span></div><div className="account-list">{accounts.map((account) => <div className="account" key={account.id}><div className="account-icon">{account.name.slice(0, 1).toUpperCase()}</div><div className="account-name"><strong>{account.name}</strong><span>{account.kind} · {account.source === "plaid" ? "Live" : "Manual"}</span></div><strong className={account.kind === "loan" || account.kind === "credit" ? "negative" : ""}>{currency(account.balance)}</strong><button className="remove" aria-label={`Remove ${account.name}`} onClick={() => onRemove(account.id)}>×</button></div>)}</div><p className="privacy-note">Your manual data is stored only in this browser. Plaid credentials are never saved in browser storage.</p></section>;
}

function AccountModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Account) => void }) {
  const [name, setName] = useState(""); const [kind, setKind] = useState<AccountKind>("investment"); const [balance, setBalance] = useState("");
  function submit(e: FormEvent) { e.preventDefault(); const amount = Number(balance); if (!name.trim() || !Number.isFinite(amount)) return; onSave({ id: crypto.randomUUID(), name: name.trim(), kind, balance: Math.abs(amount), source: "manual", updatedAt: new Date().toISOString() }); }
  return <Modal title="Add an account" onClose={onClose}><form onSubmit={submit} className="modal-form"><label>Account name<input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Google 401(k)" /></label><label>Type<select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}><option value="investment">Investment</option><option value="retirement">Retirement</option><option value="cash">Cash</option><option value="property">Property</option><option value="loan">Loan / mortgage</option><option value="credit">Credit card</option></select></label><label>Current balance<input required type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" /></label><button className="primary" type="submit">Add to plan</button></form></Modal>;
}

function PlaidModal({ onClose, onAccounts }: { onClose: () => void; onAccounts: (a: Account[]) => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "importing" | "unavailable" | "error">("checking");
  useEffect(() => { fetch("/api/plaid/link-token", { method: "POST" }).then(async (r) => { if (!r.ok) throw new Error(); const data = await r.json() as { link_token: string }; setToken(data.link_token); setState("ready"); }).catch(() => setState("unavailable")); }, []);
  const { open, ready } = usePlaidLink({ token, onSuccess: async (publicToken) => { setState("importing"); try { const response = await fetch("/api/plaid/exchange", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicToken }) }); if (!response.ok) throw new Error(); const data = await response.json() as { accounts: Account[] }; onAccounts(data.accounts); } catch { setState("error"); } } });
  return <Modal title="Connect with Plaid" onClose={onClose}><div className="plaid-panel"><div className="plaid-lock">⌁</div>{state === "checking" ? <><h3>Checking secure connection…</h3><p>This takes just a moment.</p></> : state === "ready" ? <><h3>Bring your accounts together</h3><p>Plaid opens a secure connection. One Day receives balances—not your bank credentials.</p><button className="primary" disabled={!ready} onClick={() => open()}>Choose an institution</button></> : state === "importing" ? <><h3>Importing your accounts…</h3><p>Your plan will update automatically.</p></> : state === "error" ? <><h3>We couldn’t import those accounts</h3><p>No changes were made. You can safely try again or enter them manually.</p><button className="secondary" onClick={onClose}>Close</button></> : <><h3>Connect Plaid to continue</h3><p>Add your sandbox or production Plaid credentials to the server environment. Manual accounts are fully available now.</p><code>PLAID_CLIENT_ID · PLAID_SECRET · PLAID_ENV</code><button className="secondary" onClick={onClose}>Use manual entry</button></>}</div></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>{children}</div></div>; }

function BottomNav({ view, setView }: { view: View; setView: (v: View) => void }) { const items: [View, "plan" | "places" | "wallet", string][] = [["plan", "plan", "Plan"], ["places", "places", "Places"], ["finances", "wallet", "Finances"]]; return <nav className="bottom-nav">{items.map(([id, icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon name={icon} /><span>{label}</span></button>)}</nav>; }
