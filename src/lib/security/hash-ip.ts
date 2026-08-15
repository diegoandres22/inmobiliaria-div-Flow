import { createHash } from "node:crypto";

// Nunca guardamos la IP cruda en `leads.ip_hash` — solo el hash, suficiente
// para rate limiting y detección de abuso sin retener el dato identificable.
export function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT ?? "divflow-realty-dev-salt";
  return createHash("sha256").update(salt + ip).digest("hex");
}
