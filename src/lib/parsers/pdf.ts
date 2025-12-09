import PDFParser from "pdf2json";

export function parsePDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // Extract text from all pages
        const text = pdfData.Pages.map((page) =>
          page.Texts.map((textItem) =>
            decodeURIComponent(textItem.R.map((r) => r.T).join(""))
          ).join(" ")
        ).join("\n\n");

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
