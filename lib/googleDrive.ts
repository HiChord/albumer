import { google } from "googleapis";
import { Readable } from "stream";

const DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"];

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive credentials are missing");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: DRIVE_SCOPE,
  });

  return google.drive({ version: "v3", auth });
}

interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  parentId?: string;
  makePublic?: boolean;
}

async function getOrCreateUploadsFolder(): Promise<string> {
  const drive = getDriveClient();
  const folderName = "Albumer_Uploads";
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_ID;

  // Build search query
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  // Search for existing folder
  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0 && response.data.files[0].id) {
    return response.data.files[0].id;
  }

  // Create new folder inside parent folder
  const requestBody: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId) {
    requestBody.parents = [parentFolderId];
  }

  const folderResponse = await drive.files.create({
    requestBody,
    fields: "id",
    supportsAllDrives: true,
  });

  if (!folderResponse.data.id) {
    throw new Error("Failed to create uploads folder");
  }

  return folderResponse.data.id;
}

export async function uploadToDrive({
  buffer,
  filename,
  mimeType,
  parentId,
  makePublic = true,
}: UploadOptions) {
  if (!parentId) {
    parentId = await getOrCreateUploadsFolder();
  }
  const drive = getDriveClient();

  const requestBody: { name: string; parents?: string[] } = { name: filename };
  if (parentId) {
    requestBody.parents = [parentId];
  }

  const response = await drive.files.create({
    requestBody,
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: Readable.from(buffer),
    },
    fields: "id, name, mimeType, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error("Failed to upload file to Google Drive");
  }

  if (makePublic) {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });
  }

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const viewUrl = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    id: fileId,
    name: response.data.name ?? filename,
    mimeType: response.data.mimeType ?? mimeType,
    downloadUrl,
    viewUrl,
  };
}
