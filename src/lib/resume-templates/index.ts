export type TemplateId = "us-tech" | "eu-uk" | "germany" | "creative";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  region?: string;
  industry?: string;
  features: string[];
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "us-tech",
    name: "US Tech",
    description: "Clean, professional template optimized for tech roles in the US market",
    region: "US",
    industry: "Technology",
    features: ["ATS-optimized", "1-2 pages", "No photo", "Skills focused"],
  },
  {
    id: "eu-uk",
    name: "EU / UK Professional",
    description: "Professional template following European and UK conventions",
    region: "EU/UK",
    industry: "General",
    features: ["A4 format", "Languages section", "2 pages allowed", "Profile section"],
  },
  {
    id: "germany",
    name: "German (Lebenslauf)",
    description: "Formal German CV format with photo placeholder and detailed structure",
    region: "Germany",
    industry: "General",
    features: ["Photo expected", "Formal style", "Detailed education", "Date-column layout"],
  },
  {
    id: "creative",
    name: "Creative Portfolio",
    description: "Modern design for creative professionals with portfolio emphasis",
    region: "International",
    industry: "Creative/Design",
    features: ["Visual design", "Portfolio links", "Skill bars", "Projects featured"],
  },
];
