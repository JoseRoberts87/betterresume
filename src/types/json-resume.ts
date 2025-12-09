// JSON Resume schema types (extended for BetterResume)
// Based on https://jsonresume.org/schema/

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface Profile {
  network: string;
  username?: string;
  url?: string;
}

export interface Basics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
}

export interface WorkExperience {
  id?: string;
  company: string;
  position: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  // Extended fields
  skillsUsed?: string[];
  toolsUsed?: string[];
}

export interface Education {
  id?: string;
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
  keywords?: string[];
  // Extended fields
  type?: "personal" | "freelance" | "open_source" | "academic";
  problemSolved?: string;
  technologies?: string[];
  outcomes?: string[];
}

export interface Volunteer {
  id?: string;
  organization: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
  // Extended fields
  expiration?: string;
  skillsValidated?: string[];
  verificationId?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: string;
  keywords?: string[];
  // Extended fields
  category?: "technical" | "soft" | "tool" | "domain";
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  yearsExperience?: number;
  lastUsed?: string;
}

export interface Language {
  language: string;
  fluency?: string;
}

export interface Interest {
  name: string;
  keywords?: string[];
}

export interface Reference {
  name: string;
  reference?: string;
}

export interface Award {
  title: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface Publication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

// Master Career Data - the full JSON Resume structure
export interface CareerData {
  basics?: Basics;
  work?: WorkExperience[];
  volunteer?: Volunteer[];
  education?: Education[];
  awards?: Award[];
  certifications?: Certification[];
  publications?: Publication[];
  skills?: Skill[];
  languages?: Language[];
  interests?: Interest[];
  references?: Reference[];
  projects?: Project[];
}

// Content provenance tracking
export type ContentSource = "user_input" | "document_parse" | "ai_rewrite" | "github" | "linkedin";

export interface ProvenanceRecord {
  field: string;
  source: ContentSource;
  originalValue?: string;
  timestamp: string;
  confirmed: boolean;
}
