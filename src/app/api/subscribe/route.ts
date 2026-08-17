import { NextResponse } from "next/server";
import { z } from "zod";
import { execute } from "@/lib/db";

const Schema = z.object({
  email: z.string().trim().email().max(190),
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
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  // Re-subscribing is not an error the visitor needs to hear about.
  await execute(
    "INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email",
    [parsed.data.email.toLowerCase()]
  );

  return NextResponse.json({ message: "You're on the list" });
}
