import { getSupabase, requireAuth, readJson, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const body = await readJson(req);
  const client = getSupabase();

  const { data, error } = await client
    .from("entries")
    .insert({
      date: body.date,
      start_time: body.startTime,
      end_time: body.endTime,
      break_minutes: body.breakMinutes ?? 0,
      notes: body.notes || "",
      client_id: body.clientId || null,
    })
    .select("*")
    .single();

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 201, { id: data.id });
}
