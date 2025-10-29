import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const basename = file.name.replace(`.${ext}`, '');
    const uniqueFilename = `${basename}_${timestamp}_${randomStr}.${ext}`;

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from("audio-files")
      .upload(uniqueFilename, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio-files")
      .getPublicUrl(uniqueFilename);

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        mimeType: file.type,
        externalId: uniqueFilename,
        previewUrl: urlData.publicUrl,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
