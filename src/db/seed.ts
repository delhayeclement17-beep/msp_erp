import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as bcryptjs from "bcryptjs";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Seeding users...");

  const users = [
    { email: "clement@mahieu.be",  name: "Clément",         role: "admin",     password: "mahieu2024" },
    { email: "ghislain@mahieu.be", name: "Ghislain",        role: "admin",     password: "mahieu2024" },
    { email: "allison@mahieu.be",  name: "Allison",         role: "operateur", password: "atelier2024" },
    { email: "toni@mahieu.be",     name: "Toni",            role: "operateur", password: "atelier2024" },
    { email: "reception@mahieu.be",name: "Réception",       role: "operateur", password: "atelier2024" },
  ];

  for (const u of users) {
    const hash = await bcryptjs.hash(u.password, 12);
    await db.insert(schema.users).values({
      email: u.email,
      name: u.name,
      passwordHash: hash,
      role: u.role,
    }).onConflictDoNothing();
    console.log(`  ✓ ${u.name} <${u.email}>`);
  }

  // Config defaults
  const defaults = [
    { key: "company_name",  value: "MAHIEU SABLAGE PEINTURE" },
    { key: "company_addr",  value: "" },
    { key: "company_tel",   value: "" },
    { key: "company_email", value: "" },
    { key: "company_tva",   value: "" },
    { key: "tva_default",   value: "21" },
  ];
  for (const cfg of defaults) {
    await db.insert(schema.config).values(cfg).onConflictDoNothing();
  }

  console.log("\nSeed complete.");
  console.log("─────────────────────────────────────");
  console.log("Admins:     clement@mahieu.be    / mahieu2024");
  console.log("            ghislain@mahieu.be   / mahieu2024");
  console.log("Opérateurs: allison@mahieu.be    / atelier2024");
  console.log("            toni@mahieu.be        / atelier2024");
  console.log("            reception@mahieu.be   / atelier2024");

  await pool.end();
}

seed().catch(console.error);
