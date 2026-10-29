import { sql } from "drizzle-orm";

import { db } from "@/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      service: "chautari",
      time: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { ok: false, service: "chautari" },
      { status: 503 },
    );
  }
}
