import "server-only";
import { db } from "./db";
export type Filters = { depot?: string; exercise?: string; agent?: string; q?: string; page?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function reportFilter(f: Filters, forcedDepot?: string) {
  const values: string[] = [], clauses: string[] = [];
  for (const [column, value] of [["e.depot_id", forcedDepot || f.depot], ["e.id", f.exercise], ["p.agent_id", f.agent]]) {
    if (value) { if (!uuid.test(value)) { clauses.push("false"); continue; } values.push(value); clauses.push(`${column}=$${values.length}`); }
  }
  if (f.q?.trim()) { values.push(`%${f.q.trim().slice(0,120)}%`); clauses.push(`(p.ean ilike $${values.length} or ar.article_code ilike $${values.length} or ar.designation ilike $${values.length} or l.code ilike $${values.length})`); }
  return { values, where: clauses.length ? `where ${clauses.join(" and ")}` : "" };
}
export const reportFrom = `from presences p join exercises e on e.id=p.exercise_id join depots d on d.id=e.depot_id join locations l on l.id=p.location_id join aisles s on s.id=l.aisle_id join agents ag on ag.id=p.agent_id left join articles ar on ar.id=p.article_id`;
export async function reportRows(f: Filters, forcedDepot?: string, paginate = true) {
  const { values, where } = reportFilter(f, forcedDepot);
  const page = Math.min(1000000, Math.max(1, Number.parseInt(f.page || "1",10) || 1));
  return db.query(`select p.id,d.name depot,s.code travee,l.code emplacement,p.ean,ar.article_code,ar.designation,p.scanned_at,ag.name agent,e.status,e.created_at exercise_date,
    (select url from label_photos where presence_id=p.id order by created_at desc limit 1) photo
    ${reportFrom} ${where} order by p.scanned_at desc,p.id ${paginate ? `limit 50 offset ${(page-1)*50}` : ""}`, values);
}
