import { getSupabase, requireAuth, sendJson, getSettings } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const client = getSupabase();
  const settings = await getSettings(client);
  const { data: clients, error: clientsError } = await client
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  if (clientsError) return sendJson(res, 500, { error: clientsError.message });

  const { data: entries, error: entriesError } = await client
    .from("entries")
    .select("*")
    .order("date", { ascending: false });
  if (entriesError) return sendJson(res, 500, { error: entriesError.message });

  return sendJson(res, 200, {
    settings: {
      hourlyRate: Number(settings.hourly_rate),
      currency: settings.currency,
    },
    clients: clients.map((c) => ({
      id: c.id,
      companyName: c.company_name,
      address: c.address || "",
    })),
    entries: entries.map((e) => ({
      id: e.id,
      date: e.date,
      startTime: e.start_time,
      endTime: e.end_time,
      breakMinutes: e.break_minutes,
      notes: e.notes || "",
      clientId: e.client_id || "",
    })),
  });
}
