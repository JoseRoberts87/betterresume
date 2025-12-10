import { pdf } from "@react-pdf/renderer";
import { USTechResume } from "@/lib/resume-templates/us-tech";
import { EUUKResume } from "@/lib/resume-templates/eu-uk";
import { GermanyResume } from "@/lib/resume-templates/germany";
import { CreativeResume } from "@/lib/resume-templates/creative";
import type { CareerData } from "@/types/json-resume";
import type { TemplateId } from "@/lib/resume-templates";

export interface PDFGenerationOptions {
  template: TemplateId;
  careerData: CareerData;
  targetSkills?: string[];
  photoUrl?: string; // For Germany template
}

export interface PDFGenerationResult {
  blob: Blob;
  filename: string;
}

// Generate PDF from career data
export async function generateResumePDF(
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const { template, careerData, targetSkills, photoUrl } = options;

  // Select template component based on template ID
  const getDocument = () => {
    switch (template) {
      case "eu-uk":
        return <EUUKResume data={careerData} targetSkills={targetSkills} />;
      case "germany":
        return <GermanyResume data={careerData} targetSkills={targetSkills} photoUrl={photoUrl} />;
      case "creative":
        return <CreativeResume data={careerData} targetSkills={targetSkills} />;
      case "us-tech":
      default:
        return <USTechResume data={careerData} targetSkills={targetSkills} />;
    }
  };

  // Generate PDF blob
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(getDocument() as any).toBlob();

  // Generate filename
  const name = careerData.basics?.name?.replace(/\s+/g, "_") || "resume";
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${name}_Resume_${timestamp}.pdf`;

  return { blob, filename };
}

// Generate PDF as buffer (for server-side use)
export async function generateResumePDFBuffer(
  options: PDFGenerationOptions
): Promise<Buffer> {
  const { blob } = await generateResumePDF(options);
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generate PDF as base64 (for API responses)
export async function generateResumePDFBase64(
  options: PDFGenerationOptions
): Promise<string> {
  const buffer = await generateResumePDFBuffer(options);
  return buffer.toString("base64");
}
