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

  const { data: favorites, error: favoritesError } = await client
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: true });
  if (favoritesError) return sendJson(res, 500, { error: favoritesError.message });

  return sendJson(res, 200, {
    settings: {
      hourlyRate: Number(settings.hourly_rate),
      currency: settings.currency,
    },
    clients: clients.map((c) => ({
      id: c.id,
      companyName: c.company_name,
      address: c.address || "",
      color: c.color || "#2f66f2",
      hourlyRate: c.hourly_rate ? Number(c.hourly_rate) : null,
    })),
    favorites: favorites.map((f) => ({
      id: f.id,
      label: f.label,
      startTime: f.start_time,
      endTime: f.end_time,
      breakMinutes: f.break_minutes,
      notes: f.notes || "",
      clientId: f.client_id || "",
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
