import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "image-uploads";

/**
 * Uploads an image and returns a public URL.
 * Tries Supabase Storage first (if configured), then 0x0.st.
 * Used for image-to-image editing with Infip API which requires https URLs.
 */
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as any;
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json(
      { error: "Missing file in form data" },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // 1) Try Supabase Storage if configured
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const ext = file.name.split(".").pop() || "png";
      const path = `edit/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buf = await file.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, {
          contentType: file.type,
          upsert: false,
        });

      if (!error && data?.path) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        return NextResponse.json({ url: urlData.publicUrl });
      }
      // Fall through to 0x0.st on Supabase error (e.g. bucket missing)
    } catch {
      // Fall through to 0x0.st
    }
  }

  // 2) Fallback: transfer.sh (PUT, no API key, reliable)
  try {
    const filename = file.name || "image.png";
    const putUrl = `https://transfer.sh/${encodeURIComponent(filename)}`;
    const res = await fetch(putUrl, {
      method: "PUT",
      body: file,
      cache: "no-store",
      headers: {
        "Content-Type": file.type || "image/png",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Upload failed", detail: text || res.statusText },
        { status: 502 }
      );
    }

    const url = (await res.text()).trim();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid response from upload service" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: "Upload failed", detail: String(e) },
      { status: 502 }
    );
  }
}
