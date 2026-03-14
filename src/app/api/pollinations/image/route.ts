import { NextRequest, NextResponse } from "next/server";

const NEXUSIFY_BASE = "https://api.nexusify.co";
const ALLOWED_MODELS = ["gptimage", "klein-large", "imagen-4"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, model } = body as { prompt?: string; model?: string };

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    const modelId =
      typeof model === "string" && ALLOWED_MODELS.includes(model as any)
        ? (model as (typeof ALLOWED_MODELS)[number])
        : "gptimage";

    const apiKey = process.env.NEXUSIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEXUSIFY_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const res = await fetch(`${NEXUSIFY_BASE}/v1/generate-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        prompt: prompt.trim(),
        model: modelId,
        width: 1024,
        height: 1024,
      }),
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      const message =
        typeof (data as any)?.error === "string"
          ? (data as any).error
          : "Image generation failed. Try another model or prompt.";
      return NextResponse.json(
        { error: message },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    const url = (data as any)?.imageUrl || (data as any)?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "No image returned. Try another model or prompt." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("Nexusify image proxy error:", e);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
