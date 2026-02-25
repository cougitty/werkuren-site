import { readJson, sendJson, getSupabase, requireAuth, getAuthUser, verifyPassword, hashPassword, setAuthUser } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  if (!requireAuth(req, res)) return;

  const body = await readJson(req);
  const oldPassword = String(body.oldPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!oldPassword || !newPassword) {
    return sendJson(res, 400, { error: "Missing fields" });
  }

  const client = getSupabase();
  const user = await getAuthUser(client);
  if (!user) return sendJson(res, 401, { error: "User not initialized" });

  const ok = verifyPassword(oldPassword, user.password_hash);
  if (!ok) return sendJson(res, 401, { error: "Invalid password" });

  const passwordHash = hashPassword(newPassword);
  await setAuthUser(client, { username: user.username, passwordHash });
  return sendJson(res, 200, { ok: true });
}
