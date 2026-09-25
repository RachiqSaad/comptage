import "server-only";
import { Pool } from "pg";
const g = globalThis as typeof globalThis & { pgPool?: Pool };
export const db = g.pgPool ?? new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?.includes("supabase")?{rejectUnauthorized:false}:undefined,max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:10000});
if(!g.pgPool)db.on("error",(error)=>{console.error("Connexion PostgreSQL inactive interrompue",{code:(error as Error & {code?:string}).code||"connection_error"})});
if(process.env.NODE_ENV!=="production")g.pgPool=db;
