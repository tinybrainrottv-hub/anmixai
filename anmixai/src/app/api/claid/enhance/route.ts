import { NextRequest, NextResponse } from "next/server";

const CLAID_ENDPOINT = "https://api.claid.ai/v1/image/edit";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 },
      );
    }

    const apiKey = process.env.CLAID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CLAID_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const payload = {
      input: imageUrl,
      operations: {
        restorations: {
          upscale: "smart_enhance",
          polish: true,
        },
      },
      output: {
        format: {
          type: "jpeg",
          quality: 80,
          progressive: true,
        },
      },
    };

    const upstream = await fetch(CLAID_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    if (!upstream.ok) {
      const errorMessage =
        json?.error_message ||
        json?.error ||
        "Failed to enhance image with Claid.";
      return NextResponse.json(
        { error: errorMessage, body: json ?? text },
        { status: upstream.status },
      );
    }

    const url =
      json?.data?.output?.tmp_url ||
      json?.data?.output?.object_uri ||
      json?.data?.output?.object_key ||
      null;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Unexpected Claid response shape", body: json ?? text },
        { status: 502 },
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Claid enhance error:", err);
    return NextResponse.json(
      { error: "Unexpected error while enhancing image." },
      { status: 500 },
    );
  }
}

