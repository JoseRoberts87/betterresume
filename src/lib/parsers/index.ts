import { parsePDF } from "./pdf";
import { parseDOCX } from "./docx";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain";

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; error: string | null }> {
  try {
    let text: string;

    switch (mimeType) {
      case "application/pdf":
        text = await parsePDF(buffer);
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = await parseDOCX(buffer);
        break;
      case "text/plain":
        text = buffer.toString("utf-8");
        break;
      default:
        return { text: "", error: `Unsupported file type: ${mimeType}` };
    }

    return { text: text.trim(), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown parsing error";
    return { text: "", error: message };
  }
}

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ].includes(mimeType);
}
