"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
async function admin(){const s=await getSession();if(s.role!=="ADMIN")redirect("/admin/login");}
export async function addDepot(f:FormData){await admin();const name=String(f.get("name")||"").trim();if(name)await db.query("insert into depots(name) values($1) on conflict(name) do nothing",[name]);revalidatePath("/admin")}
export async function newExercise(f:FormData){await admin();const depot=String(f.get("depot")||"");if(!depot)return;const c=await db.connect();try{await c.query("begin");await c.query("update exercises set status='CLOSED',closed_at=now() where depot_id=$1 and status='OPEN'",[depot]);await c.query("insert into exercises(depot_id,created_by) values($1,null)",[depot]);await c.query("commit")}catch(e){await c.query("rollback");throw e}finally{c.release()}revalidatePath("/admin")}
export async function addAisle(f:FormData){await admin();const depot=String(f.get("depot")||""),code=String(f.get("code")||"").trim().toUpperCase(),count=Math.min(999,Math.max(1,Number(f.get("count")||99)));if(!depot||!/^[A-Z0-9-]{1,12}$/.test(code))return;const c=await db.connect();try{await c.query("begin");const r=await c.query("insert into aisles(depot_id,code,first_number,last_number) values($1,$2,1,$3) on conflict(depot_id,code) do update set last_number=excluded.last_number returning id",[depot,code,count]);const aisle=r.rows[0].id;for(let n=1;n<=count;n++){const location=`${code}${String(n).padStart(2,"0")}`;await c.query("insert into locations(aisle_id,code,seq) values($1,$2,$3) on conflict(aisle_id,seq) do update set code=excluded.code",[aisle,location,n])}await c.query("commit")}catch(e){await c.query("rollback");throw e}finally{c.release()}revalidatePath("/admin")}
export async function addAgent(f:FormData){await admin();const name=String(f.get("name")||"").trim(),code=String(f.get("code")||"").trim(),depot=String(f.get("depot")||"");if(name&&code&&depot)await db.query("insert into agents(name,access_code,depot_id) values($1,$2,$3)",[name,code,depot]);revalidatePath("/admin")}
function parseCsv(text:string){text=text.replace(/^\uFEFF/, "").replace(/^\s*sep=[,;\t]\s*\r?\n/i, "").trimStart();const first=text.split(/\r?\n/,1)[0]||"";let inHeaderQuote=false;const counts={",":0,";":0,"\t":0};for(const ch of first){if(ch==='"')inHeaderQuote=!inHeaderQuote;else if(!inHeaderQuote&&ch in counts)counts[ch as keyof typeof counts]++}const sep=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||",";const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"'){quoted=!quoted}else if(ch===sep&&!quoted){row.push(cell.trim());cell=""}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=""}else cell+=ch}row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows}
export async function importArticles(f:FormData){
  await admin();
  const depot=String(f.get("depot")||""),file=f.get("file");
  if(!depot||!(file instanceof File)||!file.size)redirect("/admin?importError=file#import-articles");
  if(file.size>4*1024*1024)redirect("/admin?importError=size#import-articles");
  const rows=parseCsv(await file.text());
  if(rows.length<2)redirect("/admin?importError=empty#import-articles");
  const norm=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  const headers=rows[0].map(norm);
  const idx=(choices:string[])=>headers.findIndex(h=>choices.map(norm).includes(h));
  const ei=idx(["ean","ean code","code ean","gencod","code barre","code barres","code a barres","barcode","ean13","code ean13"]);
  const ai=idx(["code article","article","reference","ref","reference article","ref article","article code","sku"]);
  const di=idx(["designation","libelle","description","designation article","libelle article"]);
  if(ei<0||ai<0||di<0)redirect("/admin?importError=headers#import-articles");
  // Preserve the last valid row for an EAN, including duplicates within one batch.
  const unique=new Map<string,{ean:string;article_code:string;designation:string}>();
  for(const row of rows.slice(1)){
    const ean=row[ei]?.replace(/\s/g,""),article=row[ai]?.trim(),designation=row[di]?.trim();
    if(ean&&article&&designation)unique.set(ean,{ean,article_code:article,designation});
  }
  if(!unique.size)redirect("/admin?importError=empty#import-articles");
  const articles=Array.from(unique.values()).sort((a,b)=>a.ean.localeCompare(b.ean));
  let failure="";
  try{
    const c=await db.connect();
    try{
      await c.query("begin");
      await c.query("set local lock_timeout = '10s'");
      await c.query("set local idle_in_transaction_session_timeout = '30s'");
      for(let offset=0;offset<articles.length;offset+=500){
        await c.query(`insert into articles(depot_id,ean,article_code,designation)
          select $1::uuid,x.ean,x.article_code,x.designation
          from jsonb_to_recordset($2::jsonb) as x(ean text,article_code text,designation text)
          on conflict(depot_id,ean) do update set
            article_code=excluded.article_code,designation=excluded.designation,updated_at=now()`,
          [depot,JSON.stringify(articles.slice(offset,offset+500))]);
      }
      await c.query("commit");
    }catch(error){
      await c.query("rollback").catch(()=>{});
      throw error;
    }finally{c.release()}
  }catch(error){
    const code=(error as {code?:string}).code;
    failure=code==="57014"||code==="55P03"||code==="40P01"?"timeout":"database";
    console.error("Import articles failed",{code:code||"unknown"});
  }
  if(failure)redirect(`/admin?importError=${failure}#import-articles`);
  revalidatePath("/admin");
  redirect(`/admin?imported=${articles.length}#import-articles`);
}
