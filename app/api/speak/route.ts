import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CARTESIA_VERSION = "2025-04-16";

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text: string };
  if (!text) {
    return NextResponse.json({ error: "text missing" }, { status: 400 });
  }

  const voiceId = process.env.CARTESIA_VOICE_ID;
  if (!voiceId) {
    return NextResponse.json({ error: "CARTESIA_VOICE_ID not set" }, { status: 500 });
  }

  const res = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.CARTESIA_API_KEY ?? "",
      "Cartesia-Version": CARTESIA_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-2",
      transcript: text,
      voice: { mode: "id", id: voiceId },
      output_format: {
        container: "mp3",
        sample_rate: 44100,
        bit_rate: 128000,
      },
      language: "en",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `cartesia tts: ${err}` }, { status: 500 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
    },
  });
}
