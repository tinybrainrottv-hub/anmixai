import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL_ID = "meta-llama/llama-4-scout-17b-16e-instruct";

function buildTimeSystemMessage(nowIso?: string, timeZone?: string) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const tz = timeZone || "local";
  return (
    `You are ANMIX AI. Use the user's real-time date/time.\n` +
    `Current datetime (ISO): ${now.toISOString()}\n` +
    `Timezone: ${tz}\n` +
    `If user asks day/date/time, answer using this realtime value (2026 calendar).`
  );
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, question, nowIso, timeZone } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const system = buildTimeSystemMessage(nowIso, timeZone);
    const prompt =
      typeof question === "string" && question.trim().length > 0
        ? question.trim()
        : "Describe this image in detail.";

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL_ID,
        temperature: 1,
        top_p: 1,
        max_completion_tokens: 1024,
        stream: false,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      cache: "no-store",
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Groq API error", body: json ?? text },
        { status: res.status },
      );
    }

    const content = json?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (e) {
    console.error("Groq describe-image proxy error:", e);
    return NextResponse.json(
      { error: "Failed to call Groq vision model" },
      { status: 500 },
    );
  }
}

