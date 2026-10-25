import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, clients, stationStatuses, photos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [client] = await db.select().from(clients).where(eq(clients.id, order.clientId)).limit(1);

  const subOrders = await db.select().from(orders).where(eq(orders.parentId, id));
  const statuses = await db.select().from(stationStatuses).where(eq(stationStatuses.orderId, id));
  const orderPhotos = await db.select().from(photos).where(eq(photos.orderId, id));

  return NextResponse.json({ ...order, client, subOrders, stationStatuses: statuses, photos: orderPhotos });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  const [updated] = await db.update(orders).set({
    ...body,
    updatedAt: new Date(),
  }).where(eq(orders.id, id)).returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
