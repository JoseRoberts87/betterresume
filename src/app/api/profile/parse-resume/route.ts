import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generate } from "@/lib/ollama";

const PARSE_RESUME_PROMPT = `You are a resume parser. Extract structured information from the candidate's resume text below.

IMPORTANT:
- This is a RESUME/CV document, NOT a job posting
- Extract information ABOUT THE CANDIDATE (their name, experience, skills, education)
- If you see job requirements or "About the job" sections, IGNORE them - focus only on the candidate's information
- Look for sections like: Experience, Education, Skills, Projects, Summary, Contact Info

Return ONLY valid JSON matching this structure (omit empty sections):
{
  "basics": {
    "name": "Full Name",
    "label": "Professional Title",
    "email": "email@example.com",
    "phone": "phone number",
    "url": "personal website",
    "summary": "Professional summary",
    "location": {
      "city": "City",
      "region": "State/Region",
      "countryCode": "US"
    },
    "profiles": [
      { "network": "LinkedIn", "url": "linkedin url" },
      { "network": "GitHub", "url": "github url" }
    ]
  },
  "work": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty if current",
      "summary": "Brief role description",
      "highlights": ["Achievement 1", "Achievement 2"],
      "location": "City, State"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "studyType": "Degree Type (BS, MS, etc)",
      "area": "Field of Study",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": "GPA if mentioned"
    }
  ],
  "skills": [
    {
      "name": "Skill Category",
      "level": "expert/advanced/intermediate/beginner",
      "keywords": ["skill1", "skill2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "highlights": ["Key achievement"],
      "keywords": ["tech1", "tech2"],
      "url": "project url if any"
    }
  ],
  "languages": [
    {
      "language": "Language Name",
      "fluency": "Native/Fluent/Intermediate/Basic"
    }
  ]
}

IMPORTANT:
- Extract ALL work experience entries, preserving bullet points as highlights
- Parse dates to YYYY-MM format when possible
- Group skills by category (Programming Languages, Frameworks, Tools, etc.)
- Include ALL information from the resume - do not summarize or omit details
- Return ONLY the JSON object, no markdown formatting or explanations

Resume text to parse:
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    // Use Ollama to parse the resume into structured data
    const prompt = PARSE_RESUME_PROMPT + resumeText;

    console.log("Parsing resume with LLM...");
    console.log("Resume text preview (first 500 chars):", resumeText.slice(0, 500));
    console.log("Resume text preview (last 500 chars):", resumeText.slice(-500));

    const response = await generate(prompt, {
      temperature: 0.1, // Low temperature for consistent parsing
    });

    console.log("LLM response preview:", response.slice(0, 1000));

    // Extract JSON from the response
    let careerData;
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      careerData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Response was:", response.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse resume structure. Please try again." },
        { status: 500 }
      );
    }

    // Validate basic structure
    if (!careerData.basics && !careerData.work && !careerData.education) {
      return NextResponse.json(
        { error: "Could not extract meaningful data from resume" },
        { status: 400 }
      );
    }

    // Save to user's profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        careerData: JSON.parse(JSON.stringify(careerData)),
        basics: careerData.basics ? JSON.parse(JSON.stringify(careerData.basics)) : null,
        work: careerData.work ? JSON.parse(JSON.stringify(careerData.work)) : null,
        education: careerData.education ? JSON.parse(JSON.stringify(careerData.education)) : null,
        projects: careerData.projects ? JSON.parse(JSON.stringify(careerData.projects)) : null,
        volunteer: careerData.volunteer ? JSON.parse(JSON.stringify(careerData.volunteer)) : null,
        certifications: careerData.certifications ? JSON.parse(JSON.stringify(careerData.certifications)) : null,
      },
      update: {
        careerData: JSON.parse(JSON.stringify(careerData)),
        basics: careerData.basics ? JSON.parse(JSON.stringify(careerData.basics)) : null,
        work: careerData.work ? JSON.parse(JSON.stringify(careerData.work)) : null,
        education: careerData.education ? JSON.parse(JSON.stringify(careerData.education)) : null,
        projects: careerData.projects ? JSON.parse(JSON.stringify(careerData.projects)) : null,
        volunteer: careerData.volunteer ? JSON.parse(JSON.stringify(careerData.volunteer)) : null,
        certifications: careerData.certifications ? JSON.parse(JSON.stringify(careerData.certifications)) : null,
      },
    });

    console.log("Profile updated successfully");

    return NextResponse.json({
      success: true,
      careerData,
      summary: {
        name: careerData.basics?.name,
        workExperiences: careerData.work?.length || 0,
        educationEntries: careerData.education?.length || 0,
        skills: careerData.skills?.reduce((acc: number, s: { keywords?: string[] }) => acc + (s.keywords?.length || 0), 0) || 0,
        projects: careerData.projects?.length || 0,
        certifications: careerData.certifications?.length || 0,
      },
    });
  } catch (error) {
    console.error("Failed to parse resume:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
