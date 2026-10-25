import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, clients, stationStatuses } from "@/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { generateOrderRefAsync } from "@/lib/ref-generator";
import { getApplicableStations } from "@/lib/stations";

export async function GET() {
  const result = await db
    .select({
      id: orders.id,
      ref: orders.ref,
      dateDepot: orders.dateDepot,
      clientNom: clients.nom,
      statut: orders.statut,
      nbPieces: orders.nbPieces,
      description: orders.description,
      priorite: orders.priorite,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(isNull(orders.parentId))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    clientId, dateDepot, priorite, nDevis, delaiSouhaite,
    subOrders, // array of sub-order treatment data
    // single order fields (when no sub-orders)
    nettoyageHP, sablage, metallisation, primaire, thermolaquage, peintureLiquide,
    ral, texture, brillance, nbPieces, description, remarques, prixHT,
  } = body;

  if (!clientId || !dateDepot) {
    return NextResponse.json({ error: "Client et date requis" }, { status: 400 });
  }

  const hasSubOrders = subOrders && subOrders.length > 1;

  if (hasSubOrders) {
    // Parent order
    const parentRef = await generateOrderRefAsync();
    const [parent] = await db.insert(orders).values({
      ref: parentRef,
      dateDepot,
      priorite: priorite || "Normal",
      clientId,
      nDevis: nDevis || null,
      delaiSouhaite: delaiSouhaite || null,
      statut: "En attente",
    }).returning();

    // Sub-orders
    const suffixes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < subOrders.length; i++) {
      const sub = subOrders[i];
      const subRef = `${parentRef}-${suffixes[i]}`;
      const [child] = await db.insert(orders).values({
        ref: subRef,
        dateDepot,
        priorite: priorite || "Normal",
        clientId,
        nDevis: nDevis || null,
        parentId: parent.id,
        nettoyageHP: sub.nettoyageHP ? "Oui" : "Non",
        sablage: sub.sablage ? "Oui" : "Non",
        metallisation: sub.metallisation ? "Oui" : "Non",
        primaire: sub.primaire || "Non",
        thermolaquage: sub.thermolaquage ? "Oui" : "Non",
        peintureLiquide: sub.peintureLiquide ? "Oui" : "Non",
        ral: sub.ral || null,
        texture: sub.texture || null,
        brillance: sub.brillance || null,
        nbPieces: sub.nbPieces || null,
        description: sub.description || null,
        remarques: sub.remarques || null,
        prixHT: sub.prixHT ? parseFloat(sub.prixHT) : null,
        delaiSouhaite: delaiSouhaite || null,
        statut: "En attente",
      }).returning();

      // Create station statuses for applicable stations
      const stations = getApplicableStations(child);
      for (const code of stations) {
        await db.insert(stationStatuses).values({
          orderId: child.id,
          station: code,
          status: "En attente",
        });
      }
    }

    return NextResponse.json({ id: parent.id, ref: parentRef }, { status: 201 });
  } else {
    // Single order (or single sub-order data)
    const src = subOrders?.[0] || body;
    const ref = await generateOrderRefAsync();
    const [created] = await db.insert(orders).values({
      ref,
      dateDepot,
      priorite: priorite || "Normal",
      clientId,
      nDevis: nDevis || null,
      nettoyageHP: src.nettoyageHP ? "Oui" : "Non",
      sablage: src.sablage ? "Oui" : "Non",
      metallisation: src.metallisation ? "Oui" : "Non",
      primaire: src.primaire || "Non",
      thermolaquage: src.thermolaquage ? "Oui" : "Non",
      peintureLiquide: src.peintureLiquide ? "Oui" : "Non",
      ral: src.ral || null,
      texture: src.texture || null,
      brillance: src.brillance || null,
      nbPieces: src.nbPieces || null,
      description: src.description || null,
      remarques: src.remarques || null,
      prixHT: src.prixHT ? parseFloat(src.prixHT) : null,
      delaiSouhaite: delaiSouhaite || null,
      statut: "En attente",
    }).returning();

    // Create station statuses
    const stations = getApplicableStations(created);
    for (const code of stations) {
      await db.insert(stationStatuses).values({
        orderId: created.id,
        station: code,
        status: "En attente",
      });
    }

    return NextResponse.json({ id: created.id, ref }, { status: 201 });
  }
}
