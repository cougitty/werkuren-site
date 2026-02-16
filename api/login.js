import { readJson, sendJson, checkPassword, signToken } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  const body = await readJson(req);
  const ok = checkPassword(body.password);
  if (!ok) {
    return sendJson(res, 401, { error: "Invalid password" });
  }
  const token = signToken();
  return sendJson(res, 200, { token });
}
