import { readJson, sendJson, signToken, getSupabase, getAuthUser, verifyPassword } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  const body = await readJson(req);
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return sendJson(res, 400, { error: "Missing credentials" });
  }

  const client = getSupabase();
  const user = await getAuthUser(client);
  if (!user) {
    return sendJson(res, 401, { error: "User not initialized" });
  }
  if (String(user.username || "").toLowerCase() !== username) {
    return sendJson(res, 401, { error: "Invalid credentials" });
  }
  const ok = verifyPassword(password, user.password_hash);
  if (!ok) {
    return sendJson(res, 401, { error: "Invalid credentials" });
  }

  const token = signToken();
  return sendJson(res, 200, { token });
}
