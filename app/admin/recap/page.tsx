import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import ScanHistory from "@/app/ScanHistory";
import { Filters } from "@/lib/report";
export const dynamic="force-dynamic";
export default async function Recap({searchParams}:{searchParams:Promise<Filters>}) {
  const s=await getSession();if(s.role!=="ADMIN")redirect("/admin/login");
  return <main className="shell wide"><header className="top"><b className="brand">Comptage · Administration</b><Link className="pill" href="/admin">Configuration</Link></header><h1 className="big">Comptage et historique</h1><p className="muted">Consultez les listes de tous les dépôts, y compris les listes archivées.</p><ScanHistory filters={await searchParams} admin/></main>;
}
