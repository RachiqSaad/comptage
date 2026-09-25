"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
export async function loginAgent(form:FormData){const code=String(form.get("code")||"").trim();if(!code)redirect("/login?e=1");const r=await db.query("select a.id,a.name,a.depot_id,d.name as depot_name from agents a join depots d on d.id=a.depot_id where a.access_code=$1 and a.active=true and d.active=true limit 1",[code]);if(!r.rowCount)redirect("/login?e=1");const s=await getSession();s.userId=r.rows[0].id;s.nom=r.rows[0].name;s.depotId=r.rows[0].depot_id;s.role="AGENT";await s.save();redirect("/comptage")}
