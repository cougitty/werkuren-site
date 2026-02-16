import { getSupabase, requireAuth, readJson, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const { id } = req.query;
  const client = getSupabase();

  if (req.method === "PUT") {
    const body = await readJson(req);
    const { error } = await client
      .from("entries")
      .update({
        date: body.date,
        start_time: body.startTime,
        end_time: body.endTime,
        break_minutes: body.breakMinutes ?? 0,
        notes: body.notes || "",
        client_id: body.clientId || null,
      })
      .eq("id", id);

    if (error) return sendJson(res, 500, { error: error.message });
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "DELETE") {
    const { error } = await client.from("entries").delete().eq("id", id);
    if (error) return sendJson(res, 500, { error: error.message });
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 405;
  return res.end("Method Not Allowed");
}
