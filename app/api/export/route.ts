import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { reportRows, Filters } from "@/lib/report";
export const dynamic="force-dynamic";
function quote(value:unknown){let text=String(value??"");if(/^[\s]*[=+@-]/.test(text))text="'"+text;return `"${text.replaceAll('"','""')}"`;}
export async function GET(req:Request){
  const s=await getSession();if(s.role!=="ADMIN")return new NextResponse("Non autorisé",{status:401});
  const params=new URL(req.url).searchParams;
  const filters:Filters={};for(const key of ["depot","exercise","agent","q"] as const)filters[key]=params.get(key)||undefined;
  const result=await reportRows(filters,undefined,false);
  const headers=["Dépôt","Travée","Emplacement","EAN scanné","Code article","Désignation","Statut article","Date scan UTC","Agent","Liste créée UTC","Statut liste","Photo étiquette"];
  const lines=[headers,...result.rows.map(r=>[r.depot,r.travee,r.emplacement,r.ean,r.article_code,r.designation||"EAN inconnu",r.article_code?"RECONNU":"A_VERIFIER",new Date(r.scanned_at).toISOString(),r.agent,new Date(r.exercise_date).toISOString(),r.status,r.photo])].map(row=>row.map(quote).join(";"));
  return new NextResponse("\uFEFF"+lines.join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename=comptage-${new Date().toISOString().slice(0,10)}.csv`,"Cache-Control":"no-store"}});
}
