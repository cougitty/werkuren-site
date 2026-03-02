import { readJson, sendJson, getSupabase, checkResetCode, hashPassword, setAuthUser } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  try {
    const body = await readJson(req);
    const username = String(body.username || "").trim().toLowerCase();
    const newPassword = String(body.newPassword || "");
    const resetCode = String(body.resetCode || "");

    if (!username || !newPassword || !resetCode) {
      return sendJson(res, 400, { error: "Missing fields" });
    }

    if (!checkResetCode(resetCode)) {
      return sendJson(res, 401, { error: "Invalid reset code" });
    }

    const client = getSupabase();
    const passwordHash = hashPassword(newPassword);
    await setAuthUser(client, { username, passwordHash });
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return sendJson(res, 500, { error: message });
  }
}
