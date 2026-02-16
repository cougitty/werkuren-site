import { getSupabase, requireAuth, readJson, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const body = await readJson(req);
  if (!body.companyName) {
    return sendJson(res, 400, { error: "Missing companyName" });
  }

  const client = getSupabase();
  const { data, error } = await client
    .from("clients")
    .insert({
      company_name: body.companyName,
      address: body.address || "",
    })
    .select("*")
    .single();

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 201, { id: data.id });
}
