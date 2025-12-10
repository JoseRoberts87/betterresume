import PDFParser from "pdf2json";

// Safe decode that handles malformed URI sequences
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str.replace(/%([0-9A-Fa-f]{2})/g, (match) => {
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    });
  }
}

// Fix PDFs that have spaces between every character
function fixCharacterSpacing(text: string): string {
  // Split into lines to preserve intentional line breaks
  const lines = text.split("\n");

  const fixedLines = lines.map((line) => {
    // Check if this line has the spacing issue (majority of chars are single with spaces)
    const parts = line.split(" ").filter(p => p.length > 0);
    if (parts.length < 4) return line;

    const singleCharCount = parts.filter((p) => p.length === 1).length;

    // If more than 50% of parts are single characters, it's likely a spacing issue
    if (singleCharCount / parts.length > 0.5) {
      // Remove spaces between single characters but keep spaces for actual words
      let fixed = "";
      let i = 0;
      while (i < parts.length) {
        if (parts[i].length === 1) {
          // Collect consecutive single chars
          let word = parts[i];
          while (i + 1 < parts.length && parts[i + 1].length === 1) {
            i++;
            word += parts[i];
          }
          fixed += word + " ";
        } else {
          fixed += parts[i] + " ";
        }
        i++;
      }
      return fixed.trim();
    }

    return line;
  });

  return fixedLines.join("\n");
}

export function parsePDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // Extract text from all pages
        let text = pdfData.Pages.map((page) =>
          page.Texts.map((textItem) =>
            safeDecodeURIComponent(textItem.R.map((r) => r.T).join(""))
          ).join(" ")
        ).join("\n\n");

        // Fix character spacing issues
        text = fixCharacterSpacing(text);

        resolve(text);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.on("pdfParser_dataError", (errData: unknown) => {
      const message =
        errData instanceof Error
          ? errData.message
          : typeof errData === "object" && errData !== null && "parserError" in errData
            ? (errData as { parserError: Error }).parserError.message
            : "PDF parsing failed";
      reject(new Error(message));
    });

    pdfParser.parseBuffer(buffer);
  });
}
