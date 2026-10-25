import { db, schema } from "@/db";
import { like, desc } from "drizzle-orm";

export function generateOrderRef(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const prefix = `${mm}/`;
  const suffix = `/${yyyy}`;

  // Find the highest ref this month
  const latest = db.query.orders.findFirst({
    where: like(schema.orders.ref, `${prefix}%${suffix}`),
    orderBy: [desc(schema.orders.ref)],
  });

  // This is sync in SQLite but async in PG - we'll handle it differently
  // For now, use a simpler approach with count
  return `${prefix}001${suffix}`;
}

// Async version for PostgreSQL
export async function generateOrderRefAsync(): Promise<string> {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const prefix = `${mm}/`;
  const suffix = `/${yyyy}`;

  const latest = await db.query.orders.findFirst({
    where: like(schema.orders.ref, `${prefix}%${suffix}`),
    orderBy: [desc(schema.orders.ref)],
  });

  let nextNum = 1;
  if (latest?.ref) {
    const match = latest.ref.match(/\/(\d{3})\//);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}${suffix}`;
}
