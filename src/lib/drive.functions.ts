import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  classifyCallToolError,
  ConnectorType,
  GoogleDriveTools,
  type CallToolResult,
} from "@/lib/app-data";
import {
  catalogFile,
  type CatalogFile,
  ROOT_FOLDER_ID,
} from "@/lib/subjects";

export type DriveStatus = "ok" | "pending" | "login" | "error";

export type DriveResult<T> = {
  status: DriveStatus;
  data: T | null;
  message?: string;
  loginUrl?: string;
};

function wrapError<T>(result: CallToolResult): DriveResult<T> {
  const classified = classifyCallToolError(result);
  if (result.pending) {
    return { status: "pending", data: null, message: classified?.message };
  }
  if (result.loginRequired) {
    return {
      status: "login",
      data: null,
      message: classified?.message,
      loginUrl: result.loginUrl,
    };
  }
  return {
    status: "error",
    data: null,
    message: classified?.message ?? result.errorMessage,
  };
}

type RawItem = {
  id?: string;
  file_id?: string;
  name?: string;
  mime_type?: string;
  is_folder?: boolean;
  size_bytes?: number;
  modified_time?: string;
  web_view_link?: string;
};

function toCatalog(item: RawItem): CatalogFile | null {
  const id = item.id ?? item.file_id;
  const name = item.name;
  if (!id || !name) return null;
  const mime = item.mime_type ?? "application/octet-stream";
  return catalogFile({
    id,
    name,
    mimeType: mime,
    isFolder: item.is_folder ?? mime === "application/vnd.google-apps.folder",
    sizeBytes: item.size_bytes,
    modifiedTime: item.modified_time,
    webViewLink: item.web_view_link ?? `https://drive.google.com/file/d/${id}/view`,
  });
}

export const listDriveFolder = createServerFn({ method: "POST" })
  .validator(z.object({ folderId: z.string().min(1) }))
  .handler(async ({ data }): Promise<DriveResult<CatalogFile[]>> => {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await callTool(
      GoogleDriveTools.listFolder,
      { folder_id: data.folderId, max_results: 200 },
      { connectorType: ConnectorType.GoogleDrive },
    );
    if (!result.ok) return wrapError(result);
    const payload = result.data as { items?: RawItem[] } | null;
    const items = (payload?.items ?? [])
      .map(toCatalog)
      .filter((x): x is CatalogFile => x !== null);
    return { status: "ok", data: items };
  });

export const searchDrive = createServerFn({ method: "POST" })
  .validator(
    z.object({
      query: z.string().optional(),
      folderId: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<DriveResult<CatalogFile[]>> => {
    const { callTool } = await import("@/lib/app-data/client.server");
    const args: Record<string, unknown> = {
      max_results: 40,
      title_only: true,
    };
    if (data.query?.trim()) args.query = data.query.trim();
    args.folder_id = data.folderId ?? ROOT_FOLDER_ID;
    const result = await callTool(GoogleDriveTools.search, args, {
      connectorType: ConnectorType.GoogleDrive,
    });
    if (!result.ok) return wrapError(result);
    const payload = result.data as { files?: RawItem[] } | null;
    const items = (payload?.files ?? [])
      .map(toCatalog)
      .filter((x): x is CatalogFile => x !== null)
      .filter((f) => f.kind !== "folder");
    return { status: "ok", data: items };
  });

export const readDriveFile = createServerFn({ method: "POST" })
  .validator(z.object({ fileId: z.string().min(1) }))
  .handler(
    async ({
      data,
    }): Promise<
      DriveResult<{ name: string; content: string; truncated?: boolean }>
    > => {
      const { callTool } = await import("@/lib/app-data/client.server");
      const result = await callTool(
        GoogleDriveTools.readFile,
        { file_id: data.fileId, max_chars: 12000 },
        { connectorType: ConnectorType.GoogleDrive },
      );
      if (!result.ok) return wrapError(result);
      const payload = result.data as {
        name?: string;
        content?: string;
        truncated?: boolean;
        unsupported_reason?: string;
      } | null;
      if (!payload?.content) {
        return {
          status: "error",
          data: null,
          message:
            payload?.unsupported_reason ??
            "Este archivo no se puede leer aquí. Ábrelo en Drive.",
        };
      }
      return {
        status: "ok",
        data: {
          name: payload.name ?? "Archivo",
          content: payload.content,
          truncated: payload.truncated,
        },
      };
    },
  );

