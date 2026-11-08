"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BackendError } from "@/lib/backend";
import { getUsers, type UsersPage as UsersResult } from "@/lib/users";

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<UsersResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [retry, setRetry] = useState(0);
  const userId = session?.user.id;

  useEffect(() => {
    if (!isPending && !sessionError && !userId) router.replace("/login");
  }, [isPending, sessionError, userId, router]);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    async function loadUsers() {
      setLoading(true);
      setError("");
      try {
        const data = await getUsers(page, controller.signal);
        if (!controller.signal.aborted) setResult(data);
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof BackendError && cause.status === 401) {
          router.replace("/login");
          return;
        }
        setError(cause instanceof BackendError ? cause.message : "Unable to reach the server. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadUsers();
    return () => controller.abort();
  }, [userId, page, retry, router]);

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const response = await authClient.signOut();
      if (response.error) {
        setError(response.error.message || "Unable to log out. Please try again.");
        return;
      }
      router.replace("/login");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (isPending) return <main className="status-screen" role="status">Checking your session…</main>;
  if (sessionError) return (
    <main className="status-screen"><p role="alert">Unable to check your session.</p><button className="secondary-button" onClick={() => void refetch()}>Try again</button></main>
  );
  if (!session) return <main className="status-screen" role="status">Redirecting to login…</main>;

  return (
    <div className="users-shell">
      <header className="topbar">
        <span className="brand">alrehla<span>.</span></span>
        <div className="account-menu"><span>{session.user.name}</span><button className="secondary-button" disabled={signingOut} onClick={signOut}>{signingOut ? "Logging out…" : "Log out"}</button></div>
      </header>
      <main className="users-content">
        <p className="eyebrow">DIRECTORY</p>
        <div className="page-heading"><div><h1>Users</h1><p className="muted">People who have created an account.</p></div><button className="secondary-button" disabled={loading} onClick={() => setRetry(value => value + 1)}>Refresh</button></div>
        {error ? <div className="error" role="alert">{error} <button className="text-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : null}
        <div className="table-card" aria-busy={loading}>
          <table>
            <caption className="sr-only">Registered users</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Email status</th><th scope="col">Joined</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="table-message" role="status">Loading users…</td></tr> : error ? <tr><td colSpan={4} className="table-message">Could not load users.</td></tr> : result?.users.length ? result.users.map(user => (
                <tr key={user.id}>
                  <td className="user-name"><span className="avatar" aria-hidden="true">{user.name.trim().slice(0, 1).toUpperCase() || "?"}</span>{user.name}{user.id === userId ? <span className="you-label">You</span> : null}</td>
                  <td>{user.email}</td>
                  <td><span className={`badge ${user.emailVerified ? "verified" : ""}`}>{user.emailVerified ? "Verified" : "Unverified"}</span></td>
                  <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                </tr>
              )) : <tr><td colSpan={4} className="table-message">No users found.</td></tr>}
            </tbody>
          </table>
          <footer className="table-footer"><span>Page {page}</span><div className="pagination"><button className="secondary-button" disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={loading || !!error || !result?.hasMore} onClick={() => setPage(value => value + 1)}>Next</button></div></footer>
        </div>
      </main>
    </div>
  );
}
