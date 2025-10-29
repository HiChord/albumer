import { NextResponse } from "next/server";
import { createAlbum } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const album = await createAlbum(name || "Test Album");
    return NextResponse.json({
      success: true,
      album,
    });
  } catch (error: any) {
    console.error("Error creating album:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        name: error.name,
      },
      { status: 500 }
    );
  }
}
