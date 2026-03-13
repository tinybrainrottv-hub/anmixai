import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url, filename } = (await req.json()) as { url?: string; filename?: string };
    if (!url || !filename) {
      return NextResponse.json({ error: "url and filename are required" }, { status: 400 });
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to fetch video from provider" },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "video/mp4";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
