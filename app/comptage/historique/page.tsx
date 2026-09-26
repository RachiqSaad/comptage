import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import ScanHistory from "@/app/ScanHistory";
import { Filters } from "@/lib/report";
export const dynamic="force-dynamic";
export default async function History({searchParams}:{searchParams:Promise<Filters>}) {
  const s=await getSession();if(s.role!=="AGENT"||!s.depotId||!s.userId)redirect("/login");
  const depot=(await db.query("select name from depots where id=$1 and active",[s.depotId])).rows[0];if(!depot)redirect("/login");
  return <main className="shell wide"><header className="top"><b className="brand">{depot.name} · {s.nom}</b><Link className="pill" href="/comptage">Retour au scan</Link></header><h1 className="big">Scans du dépôt</h1><p className="muted">Historique partagé des agents de {depot.name}.</p><ScanHistory filters={await searchParams} depotId={s.depotId}/></main>;
}
