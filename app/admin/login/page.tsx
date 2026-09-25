import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loginAdmin } from "./actions";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const session = await getSession();
  if (session.userId) redirect(session.role === "ADMIN" ? "/admin" : "/comptage");
  const { e } = await searchParams;

  return <main className="shell">
    <header className="top"><span className="brand">Comptage dépôt</span><span className="pill">Administration</span></header>
    <section className="card">
      <div className="eyebrow">Gestion des dépôts</div>
      <h1 className="big">Connexion administrateur</h1>
      <p className="muted">Saisissez votre code pour accéder à l’administration.</p>
      {e && <p className="error">Code administrateur non reconnu.</p>}
      <form action={loginAdmin}>
        <label className="label" htmlFor="admin-code">Code administrateur</label>
        <input className="input" id="admin-code" name="code" type="password" autoComplete="current-password" autoFocus required />
        <button className="btn" style={{ marginTop: 16 }}>Ouvrir l’administration</button>
      </form>
    </section>
  </main>;
}
