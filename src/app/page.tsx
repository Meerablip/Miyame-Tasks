"use client";

import { useState } from "react";
import "./auth.css";

type AuthView = "login" | "signup" | "forgot";

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("EMPLOYEE");
  const [signupSecurityQuestion, setSignupSecurityQuestion] = useState("");
  const [signupSecurityAnswer, setSignupSecurityAnswer] = useState("");

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotSecurityQuestion, setForgotSecurityQuestion] = useState("");
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const clearError = () => setError("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      // Store token and user data in localStorage (persistent login per spec)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "DIRECTOR") {
        window.location.href = "/director";
      } else {
        window.location.href = "/employee";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupFullName,
          email: signupEmail,
          dob: signupDob,
          password: signupPassword,
          role: signupRole,
          securityQuestion: signupSecurityQuestion,
          securityAnswer: signupSecurityAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign up failed.");
        return;
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "DIRECTOR") {
        window.location.href = "/director";
      } else {
        window.location.href = "/employee";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const res = await fetch(
        `/api/auth/reset-password?identifier=${encodeURIComponent(forgotIdentifier)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "User not found.");
        return;
      }

      setForgotSecurityQuestion(data.securityQuestion);
      setForgotStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          securityAnswer: forgotSecurityAnswer,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }

      // Success — go back to login
      setView("login");
      setForgotStep(1);
      setForgotIdentifier("");
      setForgotSecurityAnswer("");
      setForgotNewPassword("");
      setForgotSecurityQuestion("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    clearError();
    if (newView === "forgot") {
      setForgotStep(1);
    }
  };

  return (
    <div className="auth-container">
      {/* Logo */}
      <div className="auth-logo animate-slide-up">
        <div className="logo-placeholder">
          <span>M</span>
        </div>
        <h1>MIYAME</h1>
        <p>Task Management</p>
      </div>

      {/* Toggle (only for login/signup) */}
      {view !== "forgot" && (
        <div className="auth-toggle animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <button
            className={`auth-toggle-btn ${view === "login" ? "active" : ""}`}
            onClick={() => switchView("login")}
          >
            Login
          </button>
          <button
            className={`auth-toggle-btn ${view === "signup" ? "active" : ""}`}
            onClick={() => switchView("signup")}
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="auth-error animate-slide-up">
          <span>{error}</span>
        </div>
      )}

      {/* Login Card */}
      {view === "login" && (
        <div className="auth-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to Tasks</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">EMAIL OR FULL NAME</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  className="input-field"
                  placeholder="Enter your email or full name"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <button className="auth-link" onClick={() => switchView("forgot")}>
              Forgot Password?
            </button>
          </div>
        </div>
      )}

      {/* Sign Up Card */}
      {view === "signup" && (
        <div className="auth-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Sign up to get started with Tasks</p>
          </div>

          <form onSubmit={handleSignup}>
            <div className="input-group">
              <label className="input-label">FULL NAME</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <input
                  id="signup-fullname"
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">DATE OF BIRTH</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
                <input
                  id="signup-dob"
                  type="date"
                  className="input-field"
                  value={signupDob}
                  onChange={(e) => setSignupDob(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">COMPANY EMAIL</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input
                  id="signup-email"
                  type="email"
                  className="input-field"
                  placeholder="Enter your company email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">CHOOSE ROLE</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <select
                  id="signup-role"
                  className="input-field input-field-select"
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  required
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DIRECTOR">Director</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">SECURITY QUESTION</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </span>
                <select
                  id="signup-security-question"
                  className="input-field input-field-select"
                  value={signupSecurityQuestion}
                  onChange={(e) => setSignupSecurityQuestion(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose a security question</option>
                  <option value="What is the name of your first pet?">What is the name of your first pet?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="In what city were you born?">In what city were you born?</option>
                  <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                  <option value="What was the make of your first car?">What was the make of your first car?</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">SECURITY ANSWER</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </span>
                <input
                  id="signup-security-answer"
                  type="text"
                  className="input-field"
                  placeholder="Enter your security answer"
                  value={signupSecurityAnswer}
                  onChange={(e) => setSignupSecurityAnswer(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      )}

      {/* Forgot Password Card */}
      {view === "forgot" && (
        <div className="auth-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>
              {forgotStep === 1
                ? "Enter your email or full name"
                : `Answer: ${forgotSecurityQuestion}`}
            </p>
          </div>

          {forgotStep === 1 ? (
            <form onSubmit={handleForgotStep1}>
              <div className="input-group">
                <label className="input-label">EMAIL OR FULL NAME</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input
                    id="forgot-identifier"
                    type="text"
                    className="input-field"
                    placeholder="Enter your email or full name"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Finding..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotStep2}>
              <div className="input-group">
                <label className="input-label">SECURITY ANSWER</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </span>
                  <input
                    id="forgot-answer"
                    type="text"
                    className="input-field"
                    placeholder="Enter your security answer"
                    value={forgotSecurityAnswer}
                    onChange={(e) => setForgotSecurityAnswer(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">NEW PASSWORD</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input
                    id="forgot-new-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    placeholder="Enter your new password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <button className="auth-link" onClick={() => switchView("login")}>
              ← Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
