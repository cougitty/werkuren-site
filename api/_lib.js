import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

let supabase;

export function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
      }
    );
  }
  return supabase;
}

export async function readJson(req) {
  if (req.body) return req.body;
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function requireAuth(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  try {
    const payload = jwt.verify(token, process.env.APP_JWT_SECRET);
    return payload;
  } catch {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
}

export function checkPassword(input) {
  const secret = process.env.APP_PASSWORD || "";
  const a = Buffer.from(input || "");
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signToken() {
  return jwt.sign({ role: "owner" }, process.env.APP_JWT_SECRET, { expiresIn: "30d" });
}

export async function getSettings(client) {
  const { data } = await client.from("settings").select("*").eq("id", 1).single();
  if (data) return data;
  const { data: created } = await client
    .from("settings")
    .insert({ id: 1, hourly_rate: 40, currency: "€" })
    .select("*")
    .single();
  return created;
}
