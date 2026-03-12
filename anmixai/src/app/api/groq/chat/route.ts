import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type ModelConfig = {
  id: string;
  temperature: number;
  top_p: number;
  max_completion_tokens: number;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  "ANMIX-V0.1 BEST": {
    id: "openai/gpt-oss-120b",
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 8192,
  },
  "ANMIX-V0.5 CODING THINKING": {
    id: "qwen/qwen3-32b",
    temperature: 0.6,
    top_p: 0.95,
    max_completion_tokens: 4096,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { model: displayModel, messages, nowIso, timeZone } = await req.json();
    const cfg = MODEL_MAP[String(displayModel ?? "")];

    if (!cfg || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid model or messages" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set in environment. Add it in .env.local to use text AI." },
        { status: 500 },
      );
    }

    const now = nowIso ? new Date(nowIso) : new Date();
    const systemMessage = {
      role: "system",
      content:
        "You are ANMIX AI. Use the user's real-time date/time when asked.\n" +
        `Current datetime (ISO): ${now.toISOString()}\n` +
        `Timezone: ${typeof timeZone === "string" && timeZone ? timeZone : "local"}\n` +
        "If user asks day/date/time, answer using this realtime value (2026 calendar).\n" +
        "If the user writes in Hinglish (Hindi + English mix) or casual Indian English, respond in the same style (Hinglish) unless they ask for another language.",
    };

    const normalized = messages.map((m: { role?: string; content?: unknown }) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: typeof m?.content === "string" ? String(m.content) : "",
    }));
    const withContent = normalized.filter((m: { content: string }) => m.content.length > 0);
    const toSend = withContent.length > 0 ? withContent : normalized.slice(-1);

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.id,
        messages: [systemMessage, ...toSend],
        temperature: cfg.temperature,
        top_p: cfg.top_p,
        max_completion_tokens: cfg.max_completion_tokens,
        stream: false,
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
      const errBody = json ?? (text ? String(text).slice(0, 300) : "");
      const errMsg =
        typeof json?.error === "string"
          ? json.error
          : json?.error?.message
            ? String(json.error.message)
            : res.status === 401
              ? "Invalid Groq API key. Check GROQ_API_KEY in .env.local"
              : res.status === 429
                ? "Too many requests. Try again in a moment."
                : `Groq API error (${res.status}). Try again.`;
      return NextResponse.json({ error: errMsg }, { status: res.status >= 500 ? 502 : res.status });
    }

    let content = String(json?.choices?.[0]?.message?.content ?? "").trim();
    let reasoning: string | undefined;
    const isCodingThinking = String(displayModel) === "ANMIX-V0.5 CODING THINKING";
    if (isCodingThinking && content) {
      try {
        const thinkMatch =
          content.match(/\n*<think>([\s\S]*?)<\/think>\n*/i) ??
          content.match(/\n*<thinking>([\s\S]*?)<\/thinking>\n*/i);
        if (thinkMatch?.[1]) {
          reasoning = thinkMatch[1].trim();
          content = content
            .replace(/\n*<think>[\s\S]*?<\/think>\n*/gi, "")
            .replace(/\n*<thinking>[\s\S]*?<\/thinking>\n*/gi, "")
            .trim();
        } else {
          content = content
            .replace(/\n*<think>[\s\S]*?<\/think>\n*/gi, "")
            .replace(/\n*<thinking>[\s\S]*?<\/thinking>\n*/gi, "")
            .replace(/\n*\[REASONING\][\s\S]*?(?=\n\n|$)/gi, "")
            .replace(/\n*_?Thinking:[\s\S]*?(?=\n\n|$)/gi, "")
            .trim();
        }
      } catch {
        // Fallback: strip common think patterns without extracting
        content = content
          .replace(/\n*<think>[\s\S]*?<\/think>\n*/gi, "")
          .replace(/\n*<thinking>[\s\S]*?<\/thinking>\n*/gi, "")
          .trim();
      }
    }
    return NextResponse.json(reasoning ? { content, reasoning } : { content });
  } catch (e) {
    console.error("Groq proxy error:", e);
    return NextResponse.json({ error: "Failed to call Groq API" }, { status: 500 });
  }
}

