import { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import Swal from "sweetalert2";
import "./style/AdminUpload.css";
import { useAuth } from "../lib/auth"; // <- adjust if your hook lives elsewhere

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["text/csv", "application/vnd.ms-excel"];

type Batch = {
  id: number;
  original_filename?: string;
  status?: string;
  created_at?: string;
};

export default function AdminUpload() {
  // Topbar auth (token-based per your setup)
  const { user, logout } = useAuth();

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Recent batches state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // ========= Helpers =========
  const pickFile = () => inputRef.current?.click();

  const validateFile = (f: File) => {
    const extOk = f.name.toLowerCase().endsWith(".csv");
    const mimeOk = ACCEPTED_TYPES.includes(f.type) || f.type === ""; // some browsers leave CSV mimetype empty
    const sizeOk = f.size <= MAX_SIZE;

    if (!extOk) {
      Swal.fire({ icon: "error", title: "Invalid file", text: "Please select a .csv file." });
      return false;
    }
    if (!mimeOk) {
      Swal.fire({ icon: "warning", title: "Possibly invalid format", text: "The selected file might not be a CSV." });
      // continue anyway; user acknowledged
    }
    if (!sizeOk) {
      Swal.fire({ icon: "error", title: "File too large", text: "Max file size is 5 MB." });
      return false;
    }
    return true;
  };

  const onFileSelected = (f?: File | null) => {
    if (!f) return;
    if (!validateFile(f)) return;
    setFile(f);
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    onFileSelected(f ?? null);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    onFileSelected(f ?? null);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadSample = () => {
    const sample =
      "customer_id,customer_name,customer_email,amount,currency,reference_no,date_time\n" +
      "CUST0026045,Oscar Young,oscar.young@company.biz,1869.85,AUD,REF-SR8HOOCOE8G1,12/14/2024 8:52\n" +
      "CUST0008858,Ella White,ellawhite@test.org,1573.96,EUR,REF-TMRO2SVLCFT1,11/13/2023 5:18\n";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========= Batches =========
  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const resp = await api.get("/admin/batches").then(r => r.data ?? r);
      const items: Batch[] = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      setBatches(items.slice(0, 10)); // show latest 10
    } catch {
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  // ========= Upload =========
  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);

      await api.post("/payments/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
        },
      });

      Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: "Your CSV file was uploaded and queued for processing.",
      });

      reset();
      await loadBatches();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: e?.response?.data?.message || "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== Topbar ===== */}
      <header className="topbar">
        <div className="topbar-left">
          <strong>Payments Portal</strong>
        </div>
        <div className="topbar-right">
          {user && <span className="user-info">{user.name} ({user.email})</span>}
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* ===== Page Body ===== */}
      <div className="au-page">
        <div className="au-card">
          <header className="au-header">
            <h2>Admin • Upload Payment CSV</h2>
            <p>Drag & drop your file below or choose from your computer. Max 5 MB.</p>
          </header>

          {/* Dropzone */}
          <div
            className={`au-dropzone ${dragActive ? "is-drag" : ""}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div className="au-drop-inner">
              <svg className="au-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
                <path strokeWidth="2" d="M7 9l5-5 5 5"/>
                <path strokeWidth="2" d="M12 4v12"/>
              </svg>
              <p>Drop your <strong>.csv</strong> here</p>
              <span className="au-or">or</span>
              <button className="au-btn au-btn-dark" onClick={pickFile} disabled={loading}>
                Choose File
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={onInputChange}
                className="au-hidden"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Selected file */}
          {file && (
            <div className="au-file">
              <div className="au-file-left">
                <svg className="au-file-icon" viewBox="0 0 48 48">
                  <rect x="8" y="4" width="32" height="40" rx="4" fill="currentColor" opacity=".15"/>
                  <path d="M12 14h24M12 20h24M12 26h24M12 32h14" stroke="currentColor" strokeWidth="2" />
                  <text x="30" y="36" fontSize="10" textAnchor="middle" fill="currentColor" fontWeight="700">CSV</text>
                </svg>
                <div className="au-file-meta">
                  <div className="au-file-name" title={file.name}>{file.name}</div>
                  <div className="au-file-size">{formatBytes(file.size)}</div>
                </div>
              </div>
              <div className="au-file-actions">
                <button className="au-link" onClick={reset} disabled={loading}>Remove</button>
              </div>

              {/* Progress */}
              {loading && (
                <div className="au-progress">
                  <div className="au-progress-bar" style={{ width: `${progress}%` }} />
                  <div className="au-progress-label">Uploading… {progress}%</div>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="au-actions">
            {/* <div className="au-hint">
              <svg viewBox="0 0 24 24" className="au-check">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>CSV headers must include:</span>
              <code>customer_id, customer_name, customer_email, amount, currency, reference_no, date_time</code>
            </div> */}

            <div className="au-buttons">
              {/* <button className="au-btn au-btn-ghost" onClick={downloadSample} disabled={loading}>
                Sample CSV
              </button> */}
              <button className="au-btn au-btn-primary" onClick={upload} disabled={!file || loading}>
                {loading ? "Uploading…" : "Upload CSV"}
              </button>
            </div>
          </div>

          {/* ===== Recent Batches Table ===== */}
          <section className="au-section">
            <div className="au-section-head">
              <h3>Recent Batches</h3>
              <button className="au-btn au-btn-ghost" onClick={loadBatches} disabled={loadingBatches}>
                {loadingBatches ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="au-table-wrap">
              <table className="au-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBatches ? (
                    <tr><td colSpan={4} className="au-empty">Loading…</td></tr>
                  ) : batches.length === 0 ? (
                    <tr><td colSpan={4} className="au-empty">No batches found.</td></tr>
                  ) : (
                    batches.map(b => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>{b.original_filename || "-"}</td>
                        <td>
                          <span className={`au-badge ${badgeClass(b.status)}`}>
                            {b.status || "—"}
                          </span>
                        </td>
                        <td>{b.created_at ? new Date(b.created_at).toLocaleString() : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function badgeClass(status?: string) {
  if (!status) return "is-muted";
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("success") || s.includes("processed")) return "is-green";
  if (s.includes("fail") || s.includes("error")) return "is-red";
  if (s.includes("processing") || s.includes("pending") || s.includes("queued")) return "is-blue";
  return "is-muted";
}
