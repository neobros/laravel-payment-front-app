import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Swal from "sweetalert2";
import "./style/login.css";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setErr("");
      setLoading(true);

      await login(email.trim(), password);

      await Swal.fire({
        icon: "success",
        title: "Welcome back!",
        text: "You’ve been logged in successfully.",
        confirmButtonColor: "#2563eb",
      });
      const user = JSON.parse(localStorage.getItem("user")!);

     if (user.role === "admin") {
        nav("/admin/upload");
      } else {
        nav("/user/home");
      }
      
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Login failed";
      setErr(msg);

      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: msg,
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <div className="brand">
            <div className="brand-mark">🔒</div>
            <div>
              <h2>Sign in</h2>
              <p className="muted">Access your Payments Portal account</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div className="pwd-wrap">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {err && <p className="form-error">{err}</p>}

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </button>
            <Link className="btn btn-ghost" to="/register">Create account</Link>
          </div>
        </form>

        <div className="auth-foot">
          {/* <Link to="/forgot-password" className="link">Forgot password?</Link> */}
          <span className="sep">•</span>
          <Link to="/" className="link">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
