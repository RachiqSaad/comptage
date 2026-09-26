import Link from "next/link";
import { db } from "@/lib/db";
export default async function DepotScans({depotId,exercise}:{depotId:string;exercise:string}) {
  const result=await db.query(`select p.id,p.ean,ar.article_code,ar.designation,l.code emplacement,ag.name agent,p.scanned_at
    from presences p join exercises e on e.id=p.exercise_id join locations l on l.id=p.location_id join agents ag on ag.id=p.agent_id left join articles ar on ar.id=p.article_id
    where e.id=$1 and e.depot_id=$2 order by p.scanned_at desc,p.id limit 10`,[exercise,depotId]);
  return <section className="card"><h2>Derniers scans du dépôt</h2><p className="muted">Liste en cours · tous les agents · 10 derniers scans.</p><ul className="list">{result.rows.map(r=><li key={r.id}><b>{r.article_code||r.ean}</b> · {r.emplacement}<br/><span>{r.designation||"EAN à vérifier"}</span><br/><span className="muted">{r.agent} · {new Date(r.scanned_at).toLocaleString("fr-FR",{timeZone:"UTC"})} UTC</span></li>)}</ul>{!result.rows.length&&<p className="muted">Aucun scan enregistré dans cette liste.</p>}<Link className="btn secondary" href="/comptage/historique">Voir tous les scans du dépôt</Link></section>;
}
