import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Image,
} from "@react-pdf/renderer";
import type { CareerData } from "@/types/json-resume";

// Germany Resume Template (Lebenslauf)
// Key differences: Photo expected, formal style, detailed education, 2-3 pages allowed
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: "#003366",
    paddingBottom: 15,
  },
  photoContainer: {
    width: 90,
    height: 120,
    marginRight: 20,
  },
  photo: {
    width: 90,
    height: 120,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 90,
    height: 120,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e0",
  },
  photoPlaceholderText: {
    fontSize: 8,
    color: "#718096",
    textAlign: "center",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#003366",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: "#4a5568",
    marginBottom: 12,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactItem: {
    fontSize: 9,
    color: "#4a5568",
    width: "48%",
  },
  contactLabel: {
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#003366",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#003366",
    backgroundColor: "#f7fafc",
    padding: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#003366",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dateColumn: {
    width: 100,
    paddingRight: 15,
  },
  dateText: {
    fontSize: 9,
    color: "#718096",
  },
  contentColumn: {
    flex: 1,
  },
  company: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#2d3748",
  },
  position: {
    fontSize: 10,
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
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 12,
    fontSize: 9,
    color: "#003366",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillCategory: {
    width: "48%",
    marginBottom: 8,
  },
  skillCategoryName: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#003366",
    marginBottom: 3,
  },
  skillsList: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.4,
  },
  personalInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  personalInfoItem: {
    width: "50%",
    marginBottom: 6,
  },
  personalInfoLabel: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#003366",
  },
  personalInfoValue: {
    fontSize: 9,
    color: "#4a5568",
  },
  link: {
    color: "#2b6cb0",
    textDecoration: "none",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#a0aec0",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

interface GermanyResumeProps {
  data: CareerData;
  targetSkills?: string[];
  photoUrl?: string;
}

export function GermanyResume({ data, targetSkills, photoUrl }: GermanyResumeProps) {
  const basics = data.basics;

  // Group skills by category
  const skillsByCategory = (data.skills || []).reduce(
    (acc, skill) => {
      const category = skill.keywords?.[0] || "Fachkenntnisse";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill.name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Extract languages
  const languages = data.skills?.filter(
    (s) => s.keywords?.includes("Language") || s.keywords?.includes("Languages") || s.keywords?.includes("Sprachen")
  ) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Photo */}
        <View style={styles.header}>
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image src={photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Bewerbungsfoto</Text>
                <Text style={styles.photoPlaceholderText}>(Photo)</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>{basics?.name || "Vor- und Nachname"}</Text>
            {basics?.label && <Text style={styles.title}>{basics.label}</Text>}

            <View style={styles.contactGrid}>
              {basics?.email && (
                <Text style={styles.contactItem}>
                  <Text style={styles.contactLabel}>E-Mail: </Text>
                  {basics.email}
                </Text>
              )}
              {basics?.phone && (
                <Text style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Telefon: </Text>
                  {basics.phone}
                </Text>
              )}
              {basics?.location?.city && (
                <Text style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Adresse: </Text>
                  {basics.location.address && `${basics.location.address}, `}
                  {basics.location.postalCode && `${basics.location.postalCode} `}
                  {basics.location.city}
                </Text>
              )}
              {basics?.url && (
                <Text style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Website: </Text>
                  <Link src={basics.url} style={styles.link}>
                    {basics.url.replace(/^https?:\/\//, "")}
                  </Link>
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Profile / Profil */}
        {basics?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5, color: "#4a5568" }}>
              {basics.summary}
            </Text>
          </View>
        )}

        {/* Professional Experience / Berufserfahrung */}
        {data.work && data.work.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Berufserfahrung</Text>
            {data.work.map((job, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateText}>
                    {formatDateGerman(job.startDate)} -
                  </Text>
                  <Text style={styles.dateText}>
                    {job.endDate ? formatDateGerman(job.endDate) : "heute"}
                  </Text>
                </View>
                <View style={styles.contentColumn}>
                  <Text style={styles.company}>{job.company}</Text>
                  <Text style={styles.position}>{job.position}</Text>
                  {job.location && <Text style={styles.location}>{job.location}</Text>}
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
              </View>
            ))}
          </View>
        )}

        {/* Education / Ausbildung */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ausbildung</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateText}>
                    {formatDateGerman(edu.startDate)} -
                  </Text>
                  <Text style={styles.dateText}>
                    {edu.endDate ? formatDateGerman(edu.endDate) : "heute"}
                  </Text>
                </View>
                <View style={styles.contentColumn}>
                  <Text style={styles.company}>{edu.institution}</Text>
                  <Text style={styles.position}>
                    {edu.studyType}
                    {edu.area && ` - ${edu.area}`}
                  </Text>
                  {edu.gpa && (
                    <Text style={styles.location}>Abschlussnote: {edu.gpa}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills / Kenntnisse */}
        {Object.keys(skillsByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kenntnisse und Fähigkeiten</Text>
            <View style={styles.skillsGrid}>
              {Object.entries(skillsByCategory)
                .filter(([cat]) => !cat.includes("Language") && !cat.includes("Sprachen"))
                .map(([category, skills]) => (
                  <View key={category} style={styles.skillCategory}>
                    <Text style={styles.skillCategoryName}>{category}</Text>
                    <Text style={styles.skillsList}>{skills.join(", ")}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Languages / Sprachen */}
        {languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sprachkenntnisse</Text>
            <View style={styles.skillsGrid}>
              {languages.map((lang, index) => (
                <View key={index} style={styles.skillCategory}>
                  <Text style={styles.skillCategoryName}>{lang.name}</Text>
                  <Text style={styles.skillsList}>{lang.level || "Fließend"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications / Zertifikate */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zertifikate und Weiterbildungen</Text>
            {data.certifications.map((cert, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateText}>
                    {cert.date ? formatDateGerman(cert.date) : ""}
                  </Text>
                </View>
                <View style={styles.contentColumn}>
                  <Text style={styles.company}>{cert.name}</Text>
                  <Text style={styles.position}>{cert.issuer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer with date and location */}
        <View style={styles.footer}>
          <Text>
            {basics?.location?.city || "Ort"}, {formatDateGerman(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function formatDateGerman(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" });
}

export default GermanyResume;
