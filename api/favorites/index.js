import { getSupabase, requireAuth, readJson, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const body = await readJson(req);
  if (!body.label) {
    return sendJson(res, 400, { error: "Missing label" });
  }

  const client = getSupabase();
  const { data, error } = await client
    .from("favorites")
    .insert({
      label: body.label,
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
