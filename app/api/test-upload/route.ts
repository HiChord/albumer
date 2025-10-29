import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try to upload a simple test file
    const testData = new TextEncoder().encode("test file content");
    const { data, error } = await supabase.storage
      .from("audio-files")
      .upload(`test-${Date.now()}.txt`, testData, {
        contentType: "text/plain",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
