import type { CatalogFile } from "./subjects";

export function fileEmbedUrl(file: CatalogFile): string {
  const id = file.id;
  const mime = file.mimeType;
  if (
    mime === "application/vnd.google-apps.document" ||
    mime.includes("wordprocessingml") ||
    mime === "application/msword"
  ) {
    if (mime === "application/vnd.google-apps.document") {
      return `https://docs.google.com/document/d/${id}/preview`;
    }
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  if (
    mime === "application/vnd.google-apps.presentation" ||
    mime.includes("presentationml")
  ) {
    if (mime === "application/vnd.google-apps.presentation") {
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=60000`;
    }
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  if (mime === "application/pdf" || file.kind === "pdf" || file.kind === "image") {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function isProbablyReadable(file: CatalogFile): boolean {
  return (
    file.kind === "document" ||
    file.kind === "pdf" ||
    file.kind === "text" ||
    file.kind === "slides" ||
    file.mimeType === "application/vnd.google-apps.document" ||
    file.mimeType === "application/vnd.google-apps.presentation"
  );
}
