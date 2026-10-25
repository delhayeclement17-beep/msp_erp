import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const result = q
    ? await db.select().from(clients).where(ilike(clients.nom, `%${q}%`)).limit(20)
    : await db.select().from(clients).limit(100);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nom, type, contact, telephone, email, adresse, tvaNumber } = body;

  if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const [created] = await db.insert(clients).values({
    nom,
    type: type || "Entreprise",
    contact: contact || null,
    telephone: telephone || null,
    email: email || null,
    adresse: adresse || null,
    tvaNumber: tvaNumber || null,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
