import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { CareerData } from "@/types/json-resume";

// EU/UK Resume Template
// Key differences from US: 2 pages allowed, may include nationality, languages section prominent
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#2d2d2d",
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 9,
    color: "#4a5568",
    gap: 12,
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  profileText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#4a5568",
    textAlign: "justify",
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  company: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#2d3748",
  },
  dates: {
    fontSize: 9,
    color: "#718096",
  },
  position: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#4a5568",
    marginTop: 2,
  },
  location: {
    fontSize: 9,
    color: "#718096",
    marginTop: 2,
  },
  bulletList: {
    marginTop: 6,
    marginLeft: 12,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 12,
    fontSize: 9,
    color: "#1a365d",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
    color: "#4a5568",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillCategoryName: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#2d3748",
    marginBottom: 2,
  },
  skillsList: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.4,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  languageName: {
    fontSize: 9,
    color: "#2d3748",
  },
  languageLevel: {
    fontSize: 9,
    color: "#718096",
    fontStyle: "italic",
  },
  educationItem: {
    marginBottom: 8,
  },
  institution: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#2d3748",
  },
  degree: {
    fontSize: 9,
    color: "#4a5568",
    marginTop: 2,
  },
  link: {
    color: "#2b6cb0",
    textDecoration: "none",
  },
});

interface EUUKResumeProps {
  data: CareerData;
  targetSkills?: string[];
}

export function EUUKResume({ data, targetSkills }: EUUKResumeProps) {
  const basics = data.basics;

  // Group skills by category
  const skillsByCategory = (data.skills || []).reduce(
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

  // Extract languages (could be in skills with "Language" category)
  const languages = data.skills?.filter(
    (s) => s.keywords?.includes("Language") || s.keywords?.includes("Languages")
  ) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{basics?.name || "Your Name"}</Text>
          {basics?.label && <Text style={styles.title}>{basics.label}</Text>}

          <View style={styles.contactRow}>
            {basics?.email && <Text>{basics.email}</Text>}
            {basics?.phone && <Text>{basics.phone}</Text>}
            {basics?.location?.city && (
              <Text>
                {basics.location.city}
                {basics.location.region && `, ${basics.location.region}`}
                {basics.location.countryCode && ` (${basics.location.countryCode})`}
              </Text>
            )}
          </View>

          <View style={styles.contactRow}>
            {basics?.url && (
              <Link src={basics.url} style={styles.link}>
                {basics.url.replace(/^https?:\/\//, "")}
              </Link>
            )}
            {basics?.profiles?.find((p) => p.network?.toLowerCase() === "linkedin")?.url && (
              <Link
                src={basics.profiles.find((p) => p.network?.toLowerCase() === "linkedin")!.url!}
                style={styles.link}
              >
                LinkedIn
              </Link>
            )}
            {basics?.profiles?.find((p) => p.network?.toLowerCase() === "github")?.url && (
              <Link
                src={basics.profiles.find((p) => p.network?.toLowerCase() === "github")!.url!}
                style={styles.link}
              >
                GitHub
              </Link>
            )}
          </View>
        </View>

        {/* Profile / Summary */}
        {basics?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.profileText}>{basics.summary}</Text>
          </View>
        )}

        {/* Professional Experience */}
        {data.work && data.work.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.work.map((job, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.companyRow}>
                    <Text style={styles.company}>{job.company}</Text>
                    <Text style={styles.dates}>
                      {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : "Present"}
                    </Text>
                  </View>
                  <Text style={styles.position}>{job.position}</Text>
                  {job.location && <Text style={styles.location}>{job.location}</Text>}
                </View>
                {job.highlights && job.highlights.length > 0 && (
                  <View style={styles.bulletList}>
                    {job.highlights.map((highlight, hIndex) => (
                      <View key={hIndex} style={styles.bulletItem}>
                        <Text style={styles.bullet}>-</Text>
                        <Text style={styles.bulletText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Two column layout for Skills and Languages */}
        <View style={styles.twoColumn}>
          {/* Skills */}
          <View style={styles.column}>
            {Object.keys(skillsByCategory).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Skills</Text>
                {Object.entries(skillsByCategory)
                  .filter(([cat]) => cat !== "Language" && cat !== "Languages")
                  .map(([category, skills]) => (
                    <View key={category} style={styles.skillCategory}>
                      <Text style={styles.skillCategoryName}>{category}</Text>
                      <Text style={styles.skillsList}>{skills.join(", ")}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Languages */}
          <View style={styles.column}>
            {languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    <Text style={styles.languageLevel}>{lang.level || "Fluent"}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.companyRow}>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  <Text style={styles.dates}>
                    {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : "Present"}
                  </Text>
                </View>
                <Text style={styles.degree}>
                  {edu.studyType}
                  {edu.area && ` in ${edu.area}`}
                  {edu.gpa && ` - Grade: ${edu.gpa}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Certifications</Text>
            {data.certifications.map((cert, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.companyRow}>
                  <Text style={styles.institution}>{cert.name}</Text>
                  <Text style={styles.dates}>
                    {cert.issuer}
                    {cert.date && ` | ${formatDate(cert.date)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects (if space) */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {data.projects.slice(0, 3).map((project, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.companyRow}>
                  <Text style={styles.company}>{project.name}</Text>
                  {project.technologies && (
                    <Text style={styles.dates}>
                      {project.technologies.slice(0, 4).join(", ")}
                    </Text>
                  )}
                </View>
                {project.description && (
                  <Text style={styles.bulletText}>{project.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default EUUKResume;
