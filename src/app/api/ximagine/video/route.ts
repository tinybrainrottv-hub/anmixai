import { NextRequest, NextResponse } from "next/server";

const XIMAGINE_ENDPOINT =
  process.env.XIMAGINE_VIDEO_ENDPOINT ||
  "https://ximagine-2api-pro-cfwork.kines966176.workers.dev";
const XIMAGINE_API_KEY = process.env.XIMAGINE_VIDEO_API_KEY || "sk-9661";

/** Worker uses OpenAI-style /v1/chat/completions; content can be prompt or JSON with aspectRatio, mode */
const DEFAULT_OPTIONS = {
  aspectRatio: "1:1",
  mode: "normal",
  clientPollMode: false,
};

async function pollForVideoUrl(taskId: string, uniqueId: string): Promise<string | null> {
  const maxAttempts = 60;
  const intervalMs = 3000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const res = await fetch(
        `${XIMAGINE_ENDPOINT}/v1/query/status?taskId=${encodeURIComponent(taskId)}&uniqueId=${encodeURIComponent(uniqueId)}`,
        {
          headers: { Authorization: `Bearer ${XIMAGINE_API_KEY}` },
          cache: "no-store",
        }
      );
      if (!res.ok) continue;
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        continue;
      }
      if (data?.status === "completed" && data?.videoUrl) {
        const u = data.videoUrl;
        if (typeof u === "string" && u.startsWith("http")) return u;
      }
      if (data?.status === "failed") {
        const err = data?.error ?? "Video generation failed.";
        throw new Error(typeof err === "string" ? err : "Video generation failed.");
      }
    } catch (e) {
      if (e instanceof Error && e.message !== "Video generation failed.") {
        // continue polling on network errors
        continue;
      }
      throw e;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const referenceImageUrl =
      typeof body.referenceImageUrl === "string" && body.referenceImageUrl.trim().startsWith("http")
        ? body.referenceImageUrl.trim()
        : undefined;

    // ximagine-2api worker: OpenAI-compatible POST /v1/chat/completions (content = prompt or JSON)
    const contentPayload: Record<string, unknown> = {
      prompt,
      ...DEFAULT_OPTIONS,
    };
    if (referenceImageUrl) contentPayload.imageUrl = referenceImageUrl;
    const contentAsJson = JSON.stringify(contentPayload);
    const chatPayload = {
      model: "grok-imagine-normal",
      messages: [{ role: "user" as const, content: contentAsJson }],
      stream: false,
    };

    let res = await fetch(`${XIMAGINE_ENDPOINT}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XIMAGINE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
      cache: "no-store",
    });

    if (!res.ok && res.status === 400) {
      res = await fetch(`${XIMAGINE_ENDPOINT}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XIMAGINE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-imagine-normal",
          messages: [{ role: "user" as const, content: prompt }],
          stream: false,
        }),
        cache: "no-store",
      });
    }

    const text = await res.text();
    const trimmed = (text || "").trim();

    // Worker sometimes returns plain URL or URL in first line
    if (trimmed.startsWith("http")) {
      const firstLine = trimmed.split(/\s/)[0] ?? "";
      if (firstLine.startsWith("http")) {
        return NextResponse.json({ url: firstLine });
      }
    }

    let data: Record<string, unknown> = {};
    try {
      data = trimmed ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      // Try SSE format: "data: {...}\n" or multiple data lines
      const dataLine = trimmed.split(/\n/).reverse().find((line) => line.startsWith("data:") && line.length > 5);
      const jsonStr = dataLine?.replace(/^data:\s*/, "").trim();
      if (jsonStr && jsonStr !== "[DONE]") {
        try {
          data = JSON.parse(jsonStr) as Record<string, unknown>;
        } catch {
          // fall through to non-JSON handling
        }
      }
      if (Object.keys(data).length === 0) {
        if (/<\s*!?\s*doctype|<\s*html/i.test(trimmed)) {
          return NextResponse.json(
            { error: "Video service is temporarily unavailable. Try again later." },
            { status: 502 }
          );
        }
        if (!res.ok) {
          const msg = trimmed.slice(0, 200) || `Video API error: ${res.status}`;
          return NextResponse.json(
            { error: msg },
            { status: res.status >= 500 ? 502 : res.status }
          );
        }
        // Last resort: look for a video URL in the response (e.g. in HTML or plain text)
        const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov)(?:\?[^\s"'<>]*)?/i)
          ?? trimmed.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch?.[0]) {
          return NextResponse.json({ url: urlMatch[0] });
        }
        return NextResponse.json(
          { error: "Video service returned an unexpected response. Try again or use a different prompt." },
          { status: 502 }
        );
      }
    }

    if (!res.ok) {
      const errMsg =
        typeof data?.error === "string"
          ? data.error
          : data?.message ?? data?.error?.message ?? `Video API error: ${res.status}`;
      return NextResponse.json({ error: errMsg }, { status: res.status >= 500 ? 502 : res.status });
    }

    const directUrl =
      data?.url ??
      data?.video_url ??
      data?.videoUrl ??
      data?.video?.url ??
      data?.choices?.[0]?.message?.content;
    if (directUrl && typeof directUrl === "string" && directUrl.startsWith("http")) {
      return NextResponse.json({ url: directUrl });
    }

    const taskId = data?.task_id ?? data?.taskId ?? data?.id;
    const uniqueId = data?.unique_id ?? data?.uniqueId ?? taskId;
    if (taskId && typeof taskId === "string") {
      try {
        const url = await pollForVideoUrl(taskId, String(uniqueId ?? taskId));
        if (url) return NextResponse.json({ url });
      } catch (pollErr: any) {
        return NextResponse.json(
          { error: pollErr?.message || "Video generation failed." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Video generation timed out. Try again." },
        { status: 504 }
      );
    }

    const fromChoice = data?.choices?.[0];
    if (fromChoice?.message?.content && typeof fromChoice.message.content === "string") {
      const content = fromChoice.message.content.trim();
      const maybeUrl = content.startsWith("http") ? content : null;
      const parsed = (() => {
        try {
          return JSON.parse(content);
        } catch {
          return null;
        }
      })();
      const url = maybeUrl ?? parsed?.videoUrl ?? parsed?.url ?? parsed?.video_url;
      if (url && typeof url === "string" && url.startsWith("http")) {
        return NextResponse.json({ url });
      }
    }

    const errStr =
      typeof data?.error === "string"
        ? data.error
        : data?.error?.message
          ? String(data.error.message)
          : "Video service did not return a video URL. Try a different prompt or try again.";
    return NextResponse.json({ error: errStr }, { status: 502 });
  } catch (e) {
    console.error("Ximagine video error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate video" },
      { status: 500 }
    );
  }
}
