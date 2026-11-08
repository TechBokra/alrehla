"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const name = String(values.get("name") ?? "").trim();
    if (isSignUp && !name) {
      setError("Please enter your name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Unable to continue. Please try again.");
        return;
      }
      // Start with a fresh session store after authentication. A cached logged-out
      // session can otherwise redirect before Better Auth's hook refetch finishes.
      window.location.replace("/users");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link href="/login" className="brand">alrehla<span>.</span></Link>
        <p className="eyebrow">WELCOME {isSignUp ? "ABOARD" : "BACK"}</p>
        <h1 id="auth-title">{isSignUp ? "Create your account" : "Log in to your account"}</h1>
        <p className="muted">{isSignUp ? "A few details and you’re ready to go." : "Enter your details to continue."}</p>
        <form onSubmit={submit} className="auth-form" aria-busy={pending}>
          <fieldset disabled={pending}>
            {isSignUp ? (
              <label htmlFor="name">Full name
                <input id="name" name="name" autoComplete="name" required maxLength={100} placeholder="Your name" />
              </label>
            ) : null}
            <label htmlFor="email">Email address
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </label>
            <label htmlFor="password">Password
              <input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required minLength={isSignUp ? 8 : undefined} maxLength={128} aria-describedby={isSignUp ? "password-hint" : undefined} />
            </label>
            {isSignUp ? <p id="password-hint" className="field-hint">Use between 8 and 128 characters.</p> : null}
            {error ? <p role="alert" className="error">{error}</p> : null}
            <button type="submit" className="primary-button">{pending ? "Please wait…" : isSignUp ? "Create account" : "Log in"}<span aria-hidden="true">↗</span></button>
          </fieldset>
        </form>
        <p className="auth-switch">{isSignUp ? "Already have an account?" : "New here?"} <Link href={isSignUp ? "/login" : "/sign-up"}>{isSignUp ? "Log in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}
