export type TemplateId = "us-tech";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  preview?: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "us-tech",
    name: "US Tech",
    description: "Clean, professional template optimized for tech roles in the US market",
  },
];
