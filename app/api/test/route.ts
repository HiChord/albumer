import { NextResponse } from "next/server";
import { getAllAlbums } from "@/lib/supabaseStorage";

export async function GET() {
  try {
    const albums = await getAllAlbums();
    return NextResponse.json({
      success: true,
      count: albums.length,
      albums,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      },
      { status: 500 }
    );
  }
}
