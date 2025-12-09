import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  TabStopType,
  TabStopPosition,
} from "docx";
import type { CareerData } from "@/types/json-resume";

export interface DOCXGenerationOptions {
  careerData: CareerData;
  targetSkills?: string[];
}

// Generate DOCX from career data
export async function generateResumeDOCX(
  options: DOCXGenerationOptions
): Promise<{ buffer: Buffer; filename: string }> {
  const { careerData } = options;
  const basics = careerData.basics;

  const children: Paragraph[] = [];

  // Header - Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: basics?.name || "Your Name",
          bold: true,
          size: 44, // 22pt
        }),
      ],
    })
  );

  // Contact info line
  const contactParts: string[] = [];
  if (basics?.email) contactParts.push(basics.email);
  if (basics?.phone) contactParts.push(basics.phone);
  if (basics?.location?.city) {
    const location = basics.location.city + (basics.location.region ? `, ${basics.location.region}` : "");
    contactParts.push(location);
  }
  if (basics?.url) contactParts.push(basics.url.replace(/^https?:\/\//, ""));

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: 18, // 9pt
            color: "4a4a4a",
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // LinkedIn and GitHub
  const profiles: string[] = [];
  const linkedIn = basics?.profiles?.find((p) => p.network?.toLowerCase() === "linkedin");
  const github = basics?.profiles?.find((p) => p.network?.toLowerCase() === "github");
  if (linkedIn?.url) profiles.push(`LinkedIn: ${linkedIn.url}`);
  if (github?.url) profiles.push(`GitHub: ${github.url}`);

  if (profiles.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: profiles.join(" | "),
            size: 18,
            color: "2563eb",
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Summary section
  if (basics?.summary) {
    children.push(createSectionHeader("SUMMARY"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: basics.summary,
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Experience section
  if (careerData.work && careerData.work.length > 0) {
    children.push(createSectionHeader("EXPERIENCE"));

    for (const job of careerData.work) {
      // Company and position line with date
      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: job.company,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: ` - ${job.position}`,
              italics: true,
              size: 20,
            }),
            new TextRun({
              text: "\t",
            }),
            new TextRun({
              text: `${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : "Present"}`,
              size: 18,
              color: "4a4a4a",
            }),
          ],
          spacing: { before: 100 },
        })
      );

      // Location if present
      if (job.location) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.location,
                size: 18,
                color: "4a4a4a",
              }),
            ],
          })
        );
      }

      // Highlights as bullet points
      if (job.highlights && job.highlights.length > 0) {
        for (const highlight of job.highlights) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: highlight,
                  size: 20,
                }),
              ],
              indent: { left: 360 },
            })
          );
        }
      }

      children.push(new Paragraph({ spacing: { after: 100 } }));
    }
  }

  // Skills section
  if (careerData.skills && careerData.skills.length > 0) {
    children.push(createSectionHeader("SKILLS"));

    // Group skills by category (using keywords[0] as category)
    const skillsByCategory = careerData.skills.reduce(
      (acc, skill) => {
        const category = skill.keywords?.[0] || "Technical";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(skill.name);
        return acc;
      },
      {} as Record<string, string[]>
    );

    for (const [category, skills] of Object.entries(skillsByCategory)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${category}: `,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: skills.join(", "),
              size: 20,
            }),
          ],
          spacing: { after: 50 },
        })
      );
    }

    children.push(new Paragraph({ spacing: { after: 100 } }));
  }

  // Projects section
  if (careerData.projects && careerData.projects.length > 0) {
    children.push(createSectionHeader("PROJECTS"));

    for (const project of careerData.projects.slice(0, 4)) {
      // Project name with tech
      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: project.name,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: "\t",
            }),
            new TextRun({
              text: project.technologies?.slice(0, 5).join(", ") || "",
              italics: true,
              size: 18,
              color: "4a4a4a",
            }),
          ],
          spacing: { before: 100 },
        })
      );

      // Description
      if (project.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                size: 20,
                color: "4a4a4a",
              }),
            ],
          })
        );
      }

      // Highlights
      if (project.highlights && project.highlights.length > 0) {
        for (const highlight of project.highlights.slice(0, 2)) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: highlight,
                  size: 20,
                }),
              ],
              indent: { left: 360 },
            })
          );
        }
      }
    }

    children.push(new Paragraph({ spacing: { after: 100 } }));
  }

  // Education section
  if (careerData.education && careerData.education.length > 0) {
    children.push(createSectionHeader("EDUCATION"));

    for (const edu of careerData.education) {
      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: edu.institution,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: "\t",
            }),
            new TextRun({
              text: `${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : "Present"}`,
              size: 18,
              color: "4a4a4a",
            }),
          ],
          spacing: { before: 100 },
        })
      );

      // Degree info
      const degreeInfo: string[] = [];
      if (edu.studyType) degreeInfo.push(edu.studyType);
      if (edu.area) degreeInfo.push(`in ${edu.area}`);
      if (edu.gpa) degreeInfo.push(`GPA: ${edu.gpa}`);

      if (degreeInfo.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: degreeInfo.join(" "),
                italics: true,
                size: 20,
              }),
            ],
          })
        );
      }
    }

    children.push(new Paragraph({ spacing: { after: 100 } }));
  }

  // Certifications section
  if (careerData.certifications && careerData.certifications.length > 0) {
    children.push(createSectionHeader("CERTIFICATIONS"));

    for (const cert of careerData.certifications) {
      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: "\t",
            }),
            new TextRun({
              text: [cert.issuer, cert.date ? formatDate(cert.date) : ""].filter(Boolean).join(" | "),
              size: 18,
              color: "4a4a4a",
            }),
          ],
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Generate filename
  const name = careerData.basics?.name?.replace(/\s+/g, "_") || "resume";
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${name}_Resume_${timestamp}.docx`;

  return { buffer: Buffer.from(buffer), filename };
}

// Helper function to create section headers
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24,
        allCaps: true,
      }),
    ],
    border: {
      bottom: {
        color: "1a1a1a",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 200, after: 100 },
  });
}

// Helper function to format dates
function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
