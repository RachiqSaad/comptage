import Link from "next/link";
import { db } from "@/lib/db";
import { Filters, reportFilter, reportFrom, reportRows } from "@/lib/report";
export default async function ScanHistory({ filters, depotId, admin = false }: { filters: Filters; depotId?: string; admin?: boolean }) {
  const {values,where}=reportFilter(filters,depotId);
  const [rows,totals,depots,exercises,agents]=await Promise.all([
    reportRows(filters,depotId),
    db.query(`select count(*)::int total,count(*) filter(where p.article_id is null)::int unknown,count(distinct p.location_id)::int locations ${reportFrom} ${where}`,values),
    admin?db.query("select id,name from depots order by name"):Promise.resolve({rows:[]}),
    db.query("select e.id,e.created_at,e.status,d.name depot from exercises e join depots d on d.id=e.depot_id where ($1::text is null or e.depot_id::text=$1) order by e.created_at desc",[depotId||filters.depot||null]),
    db.query("select id,name from agents where ($1::text is null or depot_id::text=$1) order by name",[depotId||filters.depot||null]),
  ]);
  const stats=totals.rows[0], page=Math.min(1000000,Math.max(1,parseInt(filters.page||"1",10)||1));
  const params=new URLSearchParams();
  for(const key of ["depot","exercise","agent","q"] as const) if(filters[key])params.set(key,filters[key]!);
  const base=admin?"/admin/recap":"/comptage/historique";
  function pageUrl(n:number){const p=new URLSearchParams(params);p.set("page",String(n));return `${base}?${p}`;}
  return <>
    <form className="card filters" action={base}>
      {admin&&<label>Dépôt<select className="select" name="depot" defaultValue={filters.depot||""}><option value="">Tous les dépôts</option>{depots.rows.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
      <label>Liste de comptage<select className="select" name="exercise" defaultValue={filters.exercise||""}><option value="">Toutes les listes</option>{exercises.rows.map(e=><option key={e.id} value={e.id}>{e.depot} · {new Date(e.created_at).toLocaleString("fr-FR",{timeZone:"UTC"})} · {e.status==="OPEN"?"En cours":"Archivée"}</option>)}</select></label>
      <label>Agent<select className="select" name="agent" defaultValue={filters.agent||""}><option value="">Tous les agents</option>{agents.rows.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Rechercher<input className="input" name="q" defaultValue={filters.q||""} placeholder="EAN, article, emplacement" maxLength={120}/></label>
      <button className="btn">Filtrer</button><Link className="btn secondary" href={base}>Réinitialiser</Link>
    </form>
    <div className="stats"><div><b>{stats.total}</b><span>Scans enregistrés</span></div><div><b>{stats.locations}</b><span>Emplacements</span></div><div><b>{stats.unknown}</b><span>EAN à vérifier</span></div></div>
    <div className="top"><p className="muted">Du plus récent au plus ancien · dates en UTC.</p>{admin&&<a className="btn compact" href={`/api/export?${params}`}>Exporter le comptage CSV</a>}</div>
    <p className="muted">Une présence par EAN, emplacement et liste. Les scans répétés ne créent pas de nouvelle ligne.{admin&&" L’export reprend tous les résultats filtrés."}</p>
    <div className="table-wrap"><table><thead><tr><th>Date du scan</th>{admin&&<th>Dépôt</th>}<th>Emplacement</th><th>EAN</th><th>Article / Désignation</th><th>Agent</th><th>Liste</th><th>Étiquette</th></tr></thead><tbody>
      {rows.rows.map(r=><tr key={r.id}><td>{new Date(r.scanned_at).toLocaleString("fr-FR",{timeZone:"UTC"})}</td>{admin&&<td>{r.depot}</td>}<td>{r.travee} / {r.emplacement}</td><td className="ean">{r.ean}</td><td><b>{r.article_code||"EAN à vérifier"}</b><br/>{r.designation||"Article non reconnu"}</td><td>{r.agent}</td><td>{r.status==="OPEN"?"En cours":"Archivée"}<br/><span className="muted">{new Date(r.exercise_date).toLocaleDateString("fr-FR",{timeZone:"UTC"})}</span></td><td>{r.photo?<a href={r.photo} target="_blank" rel="noreferrer">Voir la photo</a>:"—"}</td></tr>)}
      {!rows.rows.length&&<tr><td colSpan={admin?8:7}>Aucun scan pour ces filtres.</td></tr>}
    </tbody></table></div>
    <nav className="pagination" aria-label="Pages de l’historique">{page>1&&<Link className="pill" href={pageUrl(page-1)}>Précédent</Link>}<span>Page {page} / {Math.max(1,Math.ceil(stats.total/50))}</span>{page*50<stats.total&&<Link className="pill" href={pageUrl(page+1)}>Suivant</Link>}</nav>
  </>;
}
