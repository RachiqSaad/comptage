import { redirect } from "next/navigation";
import Link from "next/link";
import CsvFileInput from "./CsvFileInput";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logout } from "@/lib/session-actions";
import { addDepot,addAisle,addAgent,importArticles,newExercise } from "./actions";
export const dynamic="force-dynamic";
export const maxDuration=300;
export default async function Admin({searchParams}:{searchParams:Promise<{importError?:string;imported?:string}>}){
  const s=await getSession();if(s.role!=="ADMIN")redirect("/admin/login");
  const {importError,imported}=await searchParams;
  const importErrors:Record<string,string>={
    size:"Le CSV dépasse 4 Mo. Divisez-le en plusieurs fichiers avec la même ligne d’en-tête.",
    timeout:"Import annulé : la base est occupée ou le délai a été dépassé. Aucun article de cet import n’a été enregistré. Réessayez dans quelques instants.",
    database:"L’import n’a pas pu être enregistré. Vérifiez la connexion à la base et réessayez.",
    file:"Choisissez un dépôt et un fichier CSV non vide.",
    empty:"Le fichier CSV ne contient aucune ligne article à importer.",
    headers:"Colonnes non reconnues. La première ligne du CSV doit contenir EAN, code article et désignation. Vérifiez les noms des colonnes et exportez le fichier au format CSV.",
  };
  const [d,a,counts,open]=await Promise.all([
    db.query("select id,name from depots where active order by name"),
    db.query("select a.id,a.name,a.access_code,d.name depot from agents a join depots d on d.id=a.depot_id where a.active order by d.name,a.name"),
    db.query("select d.id,count(ar.id)::int articles from depots d left join articles ar on ar.depot_id=d.id group by d.id"),
    db.query("select depot_id,created_at from exercises where status='OPEN'")
  ]);
  const n=new Map(counts.rows.map(x=>[x.id,x.articles]));
  return <main className="shell">
    <header className="top"><b className="brand">Administration</b><div className="row"><Link className="pill" href="/admin/recap">Récapitulatif</Link><form action={logout}><button className="pill">Quitter</button></form></div></header>
    <h1 className="big">Configuration</h1><p className="muted">Dépôts, travées, codes agents et bases articles.</p>
    <section className="card"><h2>Créer un dépôt</h2><form action={addDepot}><label className="label">Nom du dépôt</label><div className="row"><input className="input" name="name" required placeholder="Dépôt Candy"/><button className="btn">Créer</button></div></form></section>
    <section className="card"><h2>Nouvelle liste de présence</h2><p className="muted">Archive la liste ouverte de ce dépôt et en ouvre une nouvelle.</p><form action={newExercise}><label className="label">Dépôt</label><select className="select" name="depot">{d.rows.map(x=><option key={x.id} value={x.id}>{x.name}{open.rows.some(o=>o.depot_id===x.id)?" · liste ouverte":" · aucune liste ouverte"}</option>)}</select><button className="btn secondary" style={{marginTop:12}}>Créer une nouvelle liste</button></form></section>
    <section className="card"><h2>Ajouter une travée et ses emplacements</h2><form action={addAisle}><label className="label">Dépôt</label><select className="select" name="depot" required>{d.rows.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><label className="label">Code travée (ex. TA)</label><input className="input" name="code" required placeholder="TA"/><label className="label">Nombre d’emplacements</label><input className="input" name="count" type="number" min="1" max="999" defaultValue="99"/><p className="muted">Créera TA01, TA02, …</p><button className="btn">Enregistrer la travée</button></form></section>
    <section className="card"><h2>Créer un accès agent</h2><form action={addAgent}><label className="label">Dépôt attribué</label><select className="select" name="depot">{d.rows.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><label className="label">Nom agent</label><input className="input" name="name" required/><label className="label">Code de connexion</label><input className="input" name="code" required autoComplete="off"/><button className="btn" style={{marginTop:12}}>Créer l’agent</button></form></section>
    <section className="card" id="import-articles"><h2>Importer la base articles CSV</h2>{imported&&/^\d+$/.test(imported)&&<p className="ok" role="status">Import terminé : {imported} articles enregistrés.</p>}{importError&&importErrors[importError]&&<p className="error" role="alert">{importErrors[importError]}</p>}<p className="muted">Colonnes attendues : EAN, code article, désignation. CSV de 4 Mo maximum, avec virgule ou point-virgule ; les EAN existants sont mis à jour.</p><form action={importArticles}><label className="label">Dépôt</label><select className="select" name="depot">{d.rows.map(x=><option key={x.id} value={x.id}>{x.name} · {n.get(x.id)||0} articles</option>)}</select><label className="label">Fichier CSV</label><CsvFileInput/><button className="btn" style={{marginTop:12}}>Importer</button></form></section>
    <section className="card"><h2>Agents actifs</h2><ul className="list">{a.rows.map(x=><li key={x.id}><b>{x.name}</b><br/><span className="muted">{x.depot} · code : {x.access_code}</span></li>)}</ul></section>
    <p className="footer">Les codes sont stockés en clair comme demandé. Restreignez l’accès à cette page.</p>
  </main>
}
