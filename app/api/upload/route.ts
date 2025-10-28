import { NextRequest, NextResponse } from "next/server";
import { ensureUploadsDir, getUploadPath } from "@/lib/localStorage";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure uploads directory exists
    await ensureUploadsDir();

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const basename = path.basename(file.name, ext);
    const uniqueFilename = `${basename}_${timestamp}_${randomStr}${ext}`;

    // Save file to uploads directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = getUploadPath(uniqueFilename);

    await fs.writeFile(filePath, buffer);

    // Return file URL (relative path for serving via API)
    const fileUrl = `/api/files/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url: fileUrl,
        size: file.size,
        mimeType: file.type,
        externalId: uniqueFilename,
        previewUrl: fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
