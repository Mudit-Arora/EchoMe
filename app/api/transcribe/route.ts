import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CARTESIA_VERSION = "2025-04-16";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file missing" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, "recording.webm");
  upstream.append("model", "ink-whisper");

  const res = await fetch("https://api.cartesia.ai/stt", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.CARTESIA_API_KEY ?? "",
      "Cartesia-Version": CARTESIA_VERSION,
    },
    body: upstream,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `cartesia stt: ${err}` }, { status: 500 });
  }

  const json = (await res.json()) as { text?: string };
  return NextResponse.json({ text: json.text ?? "" });
}
