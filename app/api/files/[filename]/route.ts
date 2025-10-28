import { NextRequest, NextResponse } from "next/server";
import { getUploadPath } from "@/lib/localStorage";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = getUploadPath(filename);

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";

    const mimeTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      aiff: "audio/aiff",
      m4a: "audio/mp4",
      logic: "application/octet-stream",
      logicx: "application/octet-stream",
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };

    if (ext && mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
