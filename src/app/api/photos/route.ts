import { NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const orderId = formData.get("orderId") as string;

  if (!file || !orderId) {
    return NextResponse.json({ error: "File and orderId required" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;
  const [photo] = await db.insert(photos).values({ orderId, filename, url }).returning();

  return NextResponse.json(photo, { status: 201 });
}
