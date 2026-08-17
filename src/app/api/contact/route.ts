import { NextResponse } from "next/server";
import { z } from "zod";
import { execute } from "@/lib/db";

const Schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(190),
  topic: z.string().trim().max(80).optional().default("General"),
  message: z.string().trim().min(5).max(4000),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details" },
      { status: 400 }
    );
  }

  const { name, email, topic, message } = parsed.data;
  await execute(
    "INSERT INTO messages (name, email, topic, message) VALUES (?,?,?,?)",
    [name, email, topic, message]
  );

  return NextResponse.json({ ok: true });
}
