import { NextRequest, NextResponse } from "next/server";

const POLLINATIONS_BASE = "https://gen.pollinations.ai";

const ALLOWED_MODELS = ["gptimage", "imagen-4", "grok-imagine", "klein", "klein-large"] as const;

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

    const modelId = typeof model === "string" && ALLOWED_MODELS.includes(model as any)
      ? (model as (typeof ALLOWED_MODELS)[number])
      : "klein";

    const pathPrompt = encodeURIComponent(prompt.trim());
    // API expects integer seed; -1 = random, or positive int for reproducibility
    const seed = Math.floor(Math.random() * 2147483647) + 1;
    const url = `${POLLINATIONS_BASE}/image/${pathPrompt}?model=${encodeURIComponent(modelId)}&seed=${seed}`;

    const headers: Record<string, string> = {};
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      const text = await res.text();
      let errMsg = "Image generation failed. Try another model or prompt.";
      if (res.status === 401) errMsg = "Invalid API key. Check POLLINATIONS_API_KEY.";
      else if (res.status === 429) errMsg = "Too many requests. Please try again later.";
      else if (res.status >= 400 && res.status < 500) errMsg = text?.slice(0, 200) || errMsg;
      return NextResponse.json(
        { error: errMsg },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: text?.slice(0, 200) || "Image generation failed. Try another model or prompt." },
        { status: 502 },
      );
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const isPng = contentType.includes("png") || !contentType.includes("image");
    const dataUrl = `data:${isPng ? "image/png" : contentType.split(";")[0]?.trim() || "image/png"};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (e) {
    console.error("Pollinations image proxy error:", e);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
