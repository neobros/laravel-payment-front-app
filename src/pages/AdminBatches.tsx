import { useEffect, useState } from "react";
import api from "../lib/api";

export default function AdminBatches() {
  const [list, setList] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);

  const load = async () => {
    const data = await api.get("/admin/batches").then(r=>r.data ?? r);
    setList(data);
  };

  const open = async (id: number) => {
    const data = await api.get(`/admin/batches/${id}`).then(r=>r.data ?? r);
    setBatch(data);
  };

  useEffect(()=>{ load(); }, []);

  const rows = list?.data ?? list ?? [];

  return (
    <div className="container">
      <h2>Admin: Batches</h2>
      <table className="table">
        <thead><tr><th>ID</th><th>File</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {rows.map((b: any)=>(
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.original_filename}</td>
              <td>{b.status}</td>
              <td>{new Date(b.created_at).toLocaleString()}</td>
              <td><button onClick={()=>open(b.id)}>Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {batch && (
        <div className="card">
          <h3>Batch #{batch.id}</h3>

          <h4>Payments</h4>
          <table className="table">
            <thead><tr><th>Ref</th><th>Email</th><th>Curr</th><th>Amt</th><th>USD</th><th>Processed</th></tr></thead>
            <tbody>
              {batch.payments?.map((p: any)=>(
                <tr key={p.id}>
                  <td>{p.reference}</td>
                  <td>{p.customer_email}</td>
                  <td>{p.currency}</td>
                  <td>{p.amount}</td>
                  <td>{p.amount_usd}</td>
                  <td>{p.processed ? "Yes":"No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Logs</h4>
          <ul className="list">
            {batch.logs?.map((l: any)=>(
              <li key={l.id}>
                <strong>{l.status}</strong> — {l.message} <em>({new Date(l.created_at).toLocaleString()})</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
