import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  audioUploader: f({ audio: { maxFileSize: "32MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Audio file uploaded:", file.url);
      return { url: file.url };
    }),

  logicUploader: f({ blob: { maxFileSize: "64MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Logic file uploaded:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
