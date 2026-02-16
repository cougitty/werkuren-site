import { getSupabase, requireAuth, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const { id } = req.query;
  const client = getSupabase();

  if (req.method === "DELETE") {
    const { error } = await client.from("clients").delete().eq("id", id);
    if (error) return sendJson(res, 500, { error: error.message });
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 405;
  return res.end("Method Not Allowed");
}
