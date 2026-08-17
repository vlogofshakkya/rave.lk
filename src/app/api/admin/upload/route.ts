import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cloudinaryReady, uploadImage } from "@/lib/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!cloudinaryReady()) {
    return NextResponse.json(
      { error: "Image hosting isn't configured. Add your Cloudinary keys to .env.local." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "rave-lk");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP, AVIF or GIF" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Keep images under 10 MB" }, { status: 413 });
  }

  try {
    const result = await uploadImage(file, folder);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}
