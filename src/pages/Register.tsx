import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Swal from "sweetalert2";
import "./style/login.css"; // same styling system as Login


export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);

      await Swal.fire({
        icon: "success",
        title: "Account created!",
        text: "Your account has been registered successfully.",
        confirmButtonColor: "#2563eb",
      });

      nav("/login");
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: e?.response?.data?.message || "Something went wrong.",
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
            <div className="brand-mark">📝</div>
            <div>
              <h2>Create Account</h2>
              <p className="muted">Join the Payments Portal</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="form-row">
            <label>Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <div className="pwd-wrap">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Account"}
            </button>

            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
          </div>
        </form>

        <div className="auth-foot">
          Already have an account?
          <Link to="/login" className="link"> Login</Link>
        </div>
      </div>
    </div>
  );
}
