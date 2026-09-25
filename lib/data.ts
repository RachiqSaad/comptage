import "server-only";
import { db } from "./db";
import { getSession } from "./session";
export async function requireAgent(){const s=await getSession();if(!s.userId||s.role!=="AGENT"||!s.depotId)throw new Error("Session agent requise");return s as Required<Pick<typeof s,"userId"|"role"|"depotId"|"nom">>}
export async function ensureExercise(depotId:string,agentId:string){let r=await db.query("select id from exercises where depot_id=$1 and status='OPEN' order by created_at desc limit 1",[depotId]);if(r.rowCount)return r.rows[0].id as string;r=await db.query("insert into exercises(depot_id,created_by) values($1,$2) returning id",[depotId,agentId]);return r.rows[0].id as string}
