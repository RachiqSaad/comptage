import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
export type SessionData={userId?:string;role?:"ADMIN"|"AGENT";depotId?:string;nom?:string};
export function options():SessionOptions{const password=process.env.SESSION_SECRET;if(!password||password.length<32)throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");return{cookieName:"comptage_session",password,ttl:60*60*12,cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"}}}
export async function getSession(){return getIronSession<SessionData>(await cookies(),options())}
