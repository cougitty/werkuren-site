import { getSupabase, requireAuth, readJson, sendJson } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const body = await readJson(req);
  const hourlyRate = Number(body.hourlyRate);
  const currency = body.currency || "€";

  if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
    return sendJson(res, 400, { error: "Invalid hourly rate" });
  }

  const client = getSupabase();
  const { error } = await client
    .from("settings")
    .upsert({ id: 1, hourly_rate: hourlyRate, currency });

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true });
}
