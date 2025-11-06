import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import "./style/AdminUpload.css"; // keep your shared styles
import "./style/MyPayments.css";  // small page-specific tweaks

type Payment = {
  id: number;
  payment_date: string;  // ISO or YYYY-MM-DD
  reference: string;
  currency: string;      // e.g. LKR, USD
  amount: number;
  amount_usd: number;
  processed: boolean;
};

const fmtMoney = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 2 })
    .format(value)
    // show like "LKR 1,234.00" → "LKR 1,234.00"
    .replace(/\s+/g, " ");

const fmtDate = (d: string) => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString();
};

export default function MyPayments() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // client-side filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "processed" | "pending">("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/my/payments").then((r) => r.data ?? r);
        setRows(data.data ?? data); // supports paginate or array
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      const matchesQ =
        !q ||
        p.reference?.toLowerCase().includes(q) ||
        p.currency?.toLowerCase().includes(q);
      const matchesStatus =
        status === "all" ||
        (status === "processed" && p.processed) ||
        (status === "pending" && !p.processed);
      return matchesQ && matchesStatus;
    });
  }, [rows, query, status]);

  return (
    <div className="container">
      <header className="topbar">
        <div className="topbar-left">
          <strong>Payments Portal</strong>
        </div>
        <div className="topbar-right">
          {user && <span className="user-info">{user.name} ({user.email})</span>}
          <button className="logout-btn" onClick={() => logout()}>Logout</button>
        </div>
      </header>

      <main className="au-page" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div className="au-card" style={{ width: "100%", maxWidth: 1100 }}>
          <div className="au-section-head mp-head">
            <h3>My Payments</h3>
            <div className="mp-filters">
              <input
                className="mp-input"
                placeholder="Search by reference or currency…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="mp-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="au-table-wrap">
            <table className="au-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 120 }}>Date</th>
                  <th style={{ minWidth: 160 }}>Reference</th>
                  <th>Currency</th>
                  <th style={{ textAlign: "right", minWidth: 140 }}>Amount</th>
                  <th style={{ textAlign: "right", minWidth: 140 }}>USD</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  // skeleton rows
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="mp-skel">
                      <td><div className="mp-skel-bar" /></td>
                      <td><div className="mp-skel-bar" /></td>
                      <td><div className="mp-skel-bar short" /></td>
                      <td style={{ textAlign: "right" }}><div className="mp-skel-bar" /></td>
                      <td style={{ textAlign: "right" }}><div className="mp-skel-bar" /></td>
                      <td><div className="mp-skel-chip" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="au-empty">
                      No payments{query ? " matching your filters" : ""}.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.payment_date)}</td>
                      <td className="mp-ref">
                        <span title={p.reference}>{p.reference}</span>
                        <button
                          className="au-link mp-copy"
                          onClick={() => navigator.clipboard?.writeText(p.reference)}
                          title="Copy reference"
                        >
                          Copy
                        </button>
                      </td>
                      <td>{p.currency}</td>
                      <td style={{ textAlign: "right" }}>
                        {fmtMoney(p.amount, p.currency || "USD")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {fmtMoney(p.amount_usd ?? 0, "USD")}
                      </td>
                      <td>
                        <span className={`au-badge ${p.processed ? "is-green" : "is-muted"}`}>
                          {p.processed ? "Processed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mp-foot">
            <span className="au-hint">
              <svg className="au-check" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Showing {loading ? 0 : filtered.length} {filtered.length === 1 ? "record" : "records"}
            </span>
            <div className="au-buttons">
              <button className="au-btn au-btn-ghost" onClick={() => { setQuery(""); setStatus("all"); }}>
                Clear filters
              </button>
              <a className="au-btn au-btn-primary" href="/api/my/payments/export" target="_blank" rel="noreferrer">
                Export CSV
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
