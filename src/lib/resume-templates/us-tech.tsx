import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { CareerData } from "@/types/json-resume";

// Create styles for US Tech resume template
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  contactInfo: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    fontSize: 9,
    color: "#4a4a4a",
  },
  contactItem: {
    marginHorizontal: 4,
  },
  contactSeparator: {
    color: "#9a9a9a",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 3,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  companyPosition: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  company: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  position: {
    fontSize: 10,
    fontStyle: "italic",
    marginLeft: 4,
  },
  dateLocation: {
    fontSize: 9,
    color: "#4a4a4a",
    textAlign: "right",
  },
  bulletList: {
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 10,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillCategory: {
    marginBottom: 6,
  },
  skillCategoryName: {
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  skillsList: {
    fontSize: 9,
    color: "#4a4a4a",
  },
  projectItem: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  projectName: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  projectTech: {
    fontSize: 9,
    color: "#4a4a4a",
    fontStyle: "italic",
  },
  projectDescription: {
    fontSize: 9,
    color: "#4a4a4a",
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 8,
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  institution: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  degree: {
    fontSize: 9,
    fontStyle: "italic",
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#3a3a3a",
    textAlign: "justify",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
});

interface USTechResumeProps {
  data: CareerData;
  targetSkills?: string[];
}

export function USTechResume({ data, targetSkills }: USTechResumeProps) {
  const basics = data.basics;

  // Group skills by category
  const skillsByCategory = (data.skills || []).reduce(
    (acc, skill) => {
      const category = skill.keywords?.[0] || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill.name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{basics?.name || "Your Name"}</Text>
          <View style={styles.contactInfo}>
            {basics?.email && (
              <>
                <Text style={styles.contactItem}>{basics.email}</Text>
                <Text style={styles.contactSeparator}>|</Text>
              </>
            )}
            {basics?.phone && (
              <>
                <Text style={styles.contactItem}>{basics.phone}</Text>
                <Text style={styles.contactSeparator}>|</Text>
              </>
            )}
            {basics?.location?.city && (
              <>
                <Text style={styles.contactItem}>
                  {basics.location.city}
                  {basics.location.region && `, ${basics.location.region}`}
                </Text>
                <Text style={styles.contactSeparator}>|</Text>
              </>
            )}
            {basics?.url && (
              <>
                <Link src={basics.url} style={[styles.contactItem, styles.link]}>
                  {basics.url.replace(/^https?:\/\//, "")}
                </Link>
                <Text style={styles.contactSeparator}>|</Text>
              </>
            )}
            {basics?.profiles?.find((p) => p.network?.toLowerCase() === "linkedin")?.url && (
              <Link
                src={basics.profiles.find((p) => p.network?.toLowerCase() === "linkedin")!.url!}
                style={[styles.contactItem, styles.link]}
              >
                LinkedIn
              </Link>
            )}
            {basics?.profiles?.find((p) => p.network?.toLowerCase() === "github")?.url && (
              <>
                <Text style={styles.contactSeparator}>|</Text>
                <Link
                  src={basics.profiles.find((p) => p.network?.toLowerCase() === "github")!.url!}
                  style={[styles.contactItem, styles.link]}
                >
                  GitHub
                </Link>
              </>
            )}
          </View>
        </View>

        {/* Summary */}
        {basics?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{basics.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.work && data.work.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.work.map((job, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.companyPosition}>
                    <Text style={styles.company}>{job.company}</Text>
                    <Text style={styles.position}> - {job.position}</Text>
                  </View>
                  <Text style={styles.dateLocation}>
                    {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : "Present"}
                    {job.location && ` | ${job.location}`}
                  </Text>
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

        {/* Skills */}
        {Object.keys(skillsByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <View key={category} style={styles.skillCategory}>
                <Text>
                  <Text style={styles.skillCategoryName}>{category}: </Text>
                  <Text style={styles.skillsList}>{skills.join(", ")}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.slice(0, 4).map((project, index) => (
              <View key={index} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>
                    {project.url ? (
                      <Link src={project.url} style={styles.link}>
                        {project.name}
                      </Link>
                    ) : (
                      project.name
                    )}
                  </Text>
                  {project.technologies && (
                    <Text style={styles.projectTech}>
                      {project.technologies.slice(0, 5).join(", ")}
                    </Text>
                  )}
                </View>
                {project.description && (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                )}
                {project.highlights && project.highlights.length > 0 && (
                  <View style={styles.bulletList}>
                    {project.highlights.slice(0, 2).map((highlight, hIndex) => (
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

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <View>
                    <Text style={styles.institution}>{edu.institution}</Text>
                    <Text style={styles.degree}>
                      {edu.studyType}
                      {edu.area && ` in ${edu.area}`}
                      {edu.gpa && ` - GPA: ${edu.gpa}`}
                    </Text>
                  </View>
                  <Text style={styles.dateLocation}>
                    {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : "Present"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications.map((cert, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <Text style={styles.institution}>{cert.name}</Text>
                  <Text style={styles.dateLocation}>
                    {cert.issuer}
                    {cert.date && ` | ${formatDate(cert.date)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

// Helper function to format dates
function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default USTechResume;
