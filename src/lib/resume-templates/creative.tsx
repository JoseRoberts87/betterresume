import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { CareerData } from "@/types/json-resume";

// Creative Industry Resume Template
// Key differences: More visual design freedom, portfolio link prominent, can be creative with layout
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 200,
    backgroundColor: "#1a1a2e",
    padding: 30,
    paddingTop: 50,
  },
  mainContent: {
    marginLeft: 200,
    padding: 40,
    paddingTop: 50,
  },
  // Sidebar styles
  sidebarName: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  sidebarTitle: {
    fontSize: 11,
    color: "#e94560",
    marginBottom: 25,
  },
  sidebarSection: {
    marginBottom: 20,
  },
  sidebarSectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#e94560",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e94560",
    paddingBottom: 4,
  },
  sidebarText: {
    fontSize: 9,
    color: "#b8b8d1",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  sidebarLink: {
    fontSize: 9,
    color: "#e94560",
    textDecoration: "none",
    marginBottom: 4,
  },
  skillBar: {
    marginBottom: 8,
  },
  skillName: {
    fontSize: 9,
    color: "#ffffff",
    marginBottom: 3,
  },
  skillBarBg: {
    height: 4,
    backgroundColor: "#3a3a5c",
    borderRadius: 2,
  },
  skillBarFill: {
    height: 4,
    backgroundColor: "#e94560",
    borderRadius: 2,
  },
  // Main content styles
  mainSection: {
    marginBottom: 25,
  },
  mainSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#e94560",
    paddingBottom: 6,
  },
  experienceItem: {
    marginBottom: 18,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  company: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  dates: {
    fontSize: 9,
    color: "#e94560",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  position: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 6,
  },
  bulletList: {
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 12,
    fontSize: 9,
    color: "#e94560",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: "#4a4a4a",
  },
  projectItem: {
    marginBottom: 15,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginRight: 10,
  },
  projectLink: {
    fontSize: 9,
    color: "#e94560",
    textDecoration: "none",
  },
  projectDescription: {
    fontSize: 9,
    color: "#4a4a4a",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  techTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  techTag: {
    fontSize: 8,
    color: "#1a1a2e",
    backgroundColor: "#f0f0f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  educationItem: {
    marginBottom: 10,
  },
  institution: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  degree: {
    fontSize: 9,
    color: "#666666",
  },
});

interface CreativeResumeProps {
  data: CareerData;
  targetSkills?: string[];
}

export function CreativeResume({ data, targetSkills }: CreativeResumeProps) {
  const basics = data.basics;

  // Get top skills for skill bars
  const topSkills = data.skills?.slice(0, 6) || [];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{basics?.name || "Your Name"}</Text>
          <Text style={styles.sidebarTitle}>{basics?.label || "Creative Professional"}</Text>

          {/* Contact */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Contact</Text>
            {basics?.email && <Text style={styles.sidebarText}>{basics.email}</Text>}
            {basics?.phone && <Text style={styles.sidebarText}>{basics.phone}</Text>}
            {basics?.location?.city && (
              <Text style={styles.sidebarText}>
                {basics.location.city}
                {basics.location.region && `, ${basics.location.region}`}
              </Text>
            )}
          </View>

          {/* Links / Portfolio */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Portfolio</Text>
            {basics?.url && (
              <Link src={basics.url} style={styles.sidebarLink}>
                {basics.url.replace(/^https?:\/\//, "")}
              </Link>
            )}
            {basics?.profiles?.map((profile, index) => (
              profile.url && (
                <Link key={index} src={profile.url} style={styles.sidebarLink}>
                  {profile.network}
                </Link>
              )
            ))}
          </View>

          {/* Skills with bars */}
          {topSkills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              {topSkills.map((skill, index) => {
                const level = skill.level === "expert" ? 100 :
                  skill.level === "advanced" ? 85 :
                    skill.level === "intermediate" ? 65 : 45;
                return (
                  <View key={index} style={styles.skillBar}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <View style={styles.skillBarBg}>
                      <View style={[styles.skillBarFill, { width: `${level}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Education in sidebar */}
          {data.education && data.education.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Education</Text>
              {data.education.slice(0, 2).map((edu, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Text style={styles.sidebarText}>{edu.institution}</Text>
                  <Text style={[styles.sidebarText, { fontSize: 8, color: "#8888a8" }]}>
                    {edu.studyType}
                    {edu.area && ` in ${edu.area}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Profile / About */}
          {basics?.summary && (
            <View style={styles.mainSection}>
              <Text style={styles.mainSectionTitle}>About Me</Text>
              <Text style={{ fontSize: 10, lineHeight: 1.6, color: "#4a4a4a" }}>
                {basics.summary}
              </Text>
            </View>
          )}

          {/* Featured Projects (prominent for creative) */}
          {data.projects && data.projects.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.mainSectionTitle}>Featured Projects</Text>
              {data.projects.slice(0, 4).map((project, index) => (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.url && (
                      <Link src={project.url} style={styles.projectLink}>
                        View Project
                      </Link>
                    )}
                  </View>
                  {project.description && (
                    <Text style={styles.projectDescription}>{project.description}</Text>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <View style={styles.techTags}>
                      {project.technologies.slice(0, 5).map((tech, tIndex) => (
                        <Text key={tIndex} style={styles.techTag}>{tech}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Experience */}
          {data.work && data.work.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.mainSectionTitle}>Experience</Text>
              {data.work.slice(0, 3).map((job, index) => (
                <View key={index} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.company}>{job.company}</Text>
                    <Text style={styles.dates}>
                      {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : "Present"}
                    </Text>
                  </View>
                  <Text style={styles.position}>{job.position}</Text>
                  {job.highlights && job.highlights.length > 0 && (
                    <View style={styles.bulletList}>
                      {job.highlights.slice(0, 3).map((highlight, hIndex) => (
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

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.mainSectionTitle}>Certifications</Text>
              {data.certifications.slice(0, 3).map((cert, index) => (
                <View key={index} style={styles.educationItem}>
                  <Text style={styles.institution}>{cert.name}</Text>
                  <Text style={styles.degree}>{cert.issuer}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default CreativeResume;
