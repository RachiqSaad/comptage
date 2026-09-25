"use server";
import { redirect } from "next/navigation";

import { getSession } from "./session";
export async function logout(){const s=await getSession();const destination=s.role==="ADMIN"?"/admin/login":"/login";s.destroy();redirect(destination)}
