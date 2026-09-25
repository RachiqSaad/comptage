"use server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
export async function loginAdmin(form:FormData){const code=String(form.get("code")||"");if(!process.env.ADMIN_CODE||code!==process.env.ADMIN_CODE)redirect("/admin/login?e=1");const s=await getSession();s.userId="admin";s.nom="Administrateur";s.role="ADMIN";await s.save();redirect("/admin")}
