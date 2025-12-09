# Building a modern resume creation system with intelligent matching

A well-designed resume system requires three integrated phases working seamlessly: capturing user experience through multiple channels, parsing job descriptions to extract requirements, and generating tailored resumes while identifying skill gaps. **The most successful systems combine rule-based extraction for structured data with LLM-powered semantic understanding**, achieving up to 91% matching precision versus 68% for keyword-only approaches. This report provides specific frameworks, technical implementations, and architectural patterns for building each phase.

---

## System architecture overview

The system consists of three core phases with a central data layer:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: EXPERIENCE CAPTURE                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  Document    │ │ Conversational│ │   External   │ │  Structured  │    │
│  │   Upload     │ │      Chat     │ │     APIs     │ │    Forms     │    │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                                   ▼                                      │
│                    ┌──────────────────────────┐                          │
│                    │   MASTER CAREER DATABASE │                          │
│                    │      (JSON Resume)       │                          │
│                    └──────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: JOB DESCRIPTION PARSING                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Extract: Skills │ Seniority │ Responsibilities │ Requirements   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                   │                                      │
│                                   ▼                                      │
│                    ┌──────────────────────────┐                          │
│                    │     MATCHING ENGINE       │                          │
│                    │  (Semantic + Keyword)     │                          │
│                    └──────────────────────────┘                          │
│                                   │                                      │
│                                   ▼                                      │
│                    ┌──────────────────────────┐                          │
│                    │      COVERAGE MAP         │                          │
│                    │   FULL | PARTIAL | GAP    │                          │
│                    └──────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PHASE 3: RESUME GENERATION                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │     Gap      │ │   Content    │ │   Template   │ │    Multi-    │    │
│  │  Questions   │ │   Rewriting  │ │   Selection  │ │Format Export │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Experience capture module

### Multi-modal input strategy

Effective experience capture systems must support multiple input modalities since users have vastly different starting points—some have polished LinkedIn profiles, others have outdated PDF resumes, and many have experience scattered across platforms like GitHub or Credly.

**Input Channel 1: Document Upload**
For document upload and parsing, the recommended pipeline combines PDF extraction (using `pdfminer.six` or `pypdf2`), Named Entity Recognition for names, organizations, and dates, regex patterns for emails and phone numbers, and section detection via header classification. Modern approaches use LLMs for contextual extraction, achieving **85-95% accuracy** compared to 60-70% for traditional ATS parsers.

**Input Channel 2: Conversational Interface**
Conversational interfaces excel at drawing out hidden experience through guided questions:
- "Tell me about a problem you solved at work."
- "Describe a project you built outside of work."
- "What tools or technologies did you use most frequently?"
- "Any initiative you led or process you improved?"
- "What do colleagues typically come to you for help with?"

This conversational approach surfaces non-traditional experience like personal projects, open-source contributions, and volunteer work that users often forget to include.

**Input Channel 3: External Data Sources**
For pulling data from external sources:

| Source | Access Method | Data Available |
|--------|---------------|----------------|
| LinkedIn | User-initiated data export (CSV) or PDF parsing | Positions, education, skills, certifications |
| GitHub | REST API (5,000 req/hr authenticated) | Repos, languages, contribution history |
| Credly | API with OAuth | Verified certifications with skill metadata |
| Portfolio sites | Web scraping with user permission | Projects, case studies |

**Input Channel 4: Structured Forms**
Traditional form entry for users who prefer direct input, with smart defaults and autocomplete from skill taxonomies.

### Master career database schema

**The JSON Resume schema** serves as the canonical format for storing career data, with wide adoption across 400+ themes and rendering tools. Extended schema for this system:

```json
{
  "basics": { "name", "email", "phone", "location", "summary", "profiles[]" },
  "work": [{
    "company", "position", "startDate", "endDate", "summary",
    "highlights": ["achievement with metrics"],
    "skills_used": ["skill_id"],
    "tools_used": ["tool_name"]
  }],
  "projects": [{
    "name", "description", "url", "startDate", "endDate",
    "problem_solved", "technologies": [], "outcomes": [],
    "type": "personal|freelance|open_source|academic"
  }],
  "certifications": [{
    "name", "issuer", "date", "url", "expiration",
    "skills_validated": [], "verification_id"
  }],
  "education": [{ "institution", "area", "studyType", "startDate", "endDate", "gpa", "courses[]" }],
  "skills": [{
    "name", "category": "technical|soft|tool|domain",
    "proficiency": "beginner|intermediate|advanced|expert",
    "years_experience", "last_used"
  }],
  "volunteer": [{ "organization", "position", "startDate", "endDate", "highlights[]" }]
}
```

This creates a **Master Career Database** that serves as the single source of truth for all resume generation.

---

## Phase 2: Job description parsing module

### Skill and requirement extraction

Extracting structured requirements from job descriptions involves distinguishing required versus preferred skills, technical versus soft skills, experience levels, and responsibilities. **The state-of-the-art approach combines trie-based pattern matching for speed with transformer models for semantic understanding**.

**Technical Implementation:**
- **SkillNER** (open-source): spaCy-based with EMSI/Lightcast skill database
- **JobBERT**: Domain-pretrained transformer for job posting understanding
- **Skill-LLM**: Fine-tuned LLM achieving **64.8% F1 score** on SkillSpan benchmark

**Extraction Categories:**

| Category | Examples | Detection Method |
|----------|----------|------------------|
| Required Skills | "Must have Python experience" | Keyword modifiers + section position |
| Preferred Skills | "Nice to have: AWS certification" | Linguistic patterns |
| Technical Skills | Python, SQL, Kubernetes | Skill taxonomy matching |
| Soft Skills | Leadership, communication | Soft skill dictionary |
| Tools/Software | Salesforce, Jira, Figma | Tool database lookup |
| Domain Knowledge | Healthcare, fintech, e-commerce | Industry classifier |
| Certifications | PMP, AWS Solutions Architect | Certification database |

### Seniority signal extraction (NEW)

Detecting experience level requirements from JD language enables better matching and realistic gap identification:

**Seniority Detection Patterns:**

| Level | Signals | Years Indicator |
|-------|---------|-----------------|
| Entry | "entry-level," "junior," "associate," "0-2 years" | 0-2 years |
| Mid | "mid-level," "3-5 years," no modifier | 3-5 years |
| Senior | "senior," "5+ years," "7+ years," "extensive experience" | 5-8 years |
| Lead | "lead," "principal," "staff," "8+ years" | 8+ years |
| Executive | "director," "VP," "head of," "10+ years" | 10+ years |

**Implementation:** Combine regex patterns for explicit year mentions with classifier for implicit signals (title keywords, responsibility scope, team size mentions).

### Requirement prioritization

Distinguishing "must have" from "nice to have" requirements:

**Priority Scoring:**
- **P1 (Required):** Items marked "must have," "required," "mandatory," in "Requirements" section
- **P2 (Important):** Skills repeated 2+ times, core responsibilities
- **P3 (Preferred):** Items marked "nice to have," "preferred," "bonus," in "Nice to Have" section
- **P4 (Optional):** Single mentions, peripheral skills

---

## Phase 2.5: Coverage map and matching engine

### Semantic matching approach

Matching user experience against job requirements benefits enormously from semantic understanding. **Hybrid approaches combining semantic similarity with keyword overlap achieve 87-91% precision**, while keyword-only approaches plateau around 68%.

**Matching Formula:**
```
Match Score = (0.60 × Semantic Similarity) 
            + (0.25 × Required Skills Overlap)
            + (0.10 × Preferred Skills Overlap)
            + (0.05 × Experience Level Alignment)
```

**Embedding Models:**
- `all-MiniLM-L6-v2`: Best speed-accuracy tradeoff (384 dimensions, ~10ms)
- `paraphrase-mpnet-base-v2`: Higher accuracy for batch processing (768 dimensions)

### Coverage map visualization (NEW)

The coverage map provides users with an at-a-glance understanding of their fit for a role:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COVERAGE MAP                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  JD Requirement          │ Your Experience              │ Status        │
├──────────────────────────┼──────────────────────────────┼───────────────┤
│  Python (Required)       │ Data Automation Project,     │ ✅ FULL       │
│                          │ ML Pipeline at Company X     │               │
├──────────────────────────┼──────────────────────────────┼───────────────┤
│  Agile/Scrum (Required)  │ Scrum Master certification,  │ ✅ FULL       │
│                          │ 2 years as SM at Company Y   │               │
├──────────────────────────┼──────────────────────────────┼───────────────┤
│  AWS (Required)          │ Some EC2 usage in side       │ ⚠️ PARTIAL    │
│                          │ project (no certification)   │               │
├──────────────────────────┼──────────────────────────────┼───────────────┤
│  Kubernetes (Preferred)  │ No direct experience         │ ❌ GAP        │
│                          │ (Docker experience related)  │               │
├──────────────────────────┼──────────────────────────────┼───────────────┤
│  5+ Years Experience     │ 7 years in software dev      │ ✅ FULL       │
│  (Required)              │                              │               │
└─────────────────────────────────────────────────────────────────────────┘

Overall Match: 78% | Required Coverage: 3/4 | Gaps to Address: 1
```

**Status Definitions:**
- **FULL (✅):** Direct experience with evidence; include prominently
- **PARTIAL (⚠️):** Related experience or limited exposure; highlight transferable aspects
- **GAP (❌):** No matching experience; trigger gap questions or acknowledge honestly

### Skill inference from experience

Unlocking implicit qualifications users haven't explicitly listed:

| Experience Language | Inferred Skills |
|---------------------|-----------------|
| "Led team of 5 engineers" | Leadership, team management, mentoring |
| "Increased revenue by 40%" | Business development, analytics, stakeholder management |
| "Deployed to production" | DevOps, CI/CD, release management |
| "Migrated legacy system" | System architecture, technical planning, risk management |
| "Reduced costs by $500K" | Cost optimization, vendor management, process improvement |

---

## Phase 3: Resume generation module

### Gap analysis and intelligent question generation

When gaps are identified, the system generates targeted questions to surface potentially relevant but unmentioned experience:

**Gap Question Templates:**

For missing technical skills:
- "Have you worked with any technologies similar to [gap skill]?"
- "In your [related project], did you encounter anything involving [gap skill]?"
- "Have you taken any courses or done self-study on [gap skill]?"

For missing soft skills:
- "Can you describe a time you had to [skill behavior]?"
- "In your role at [company], how did you handle [skill scenario]?"

For experience level gaps:
- "Do you have any additional projects or freelance work that demonstrates [required experience]?"
- "Have you mentored others or led initiatives that show [seniority indicator]?"

**Achievement Quantification Prompts:**
- "What was the measurable outcome of this project?"
- "How large was the team, budget, or user base?"
- "Can you estimate the percentage improvement or time saved?"

### Content rewriting for impact

**Bullet Transformation Formula:** Action Verb + Task/Context + Quantified Result

| Original | Rewritten |
|----------|-----------|
| "Worked on web app" | "Developed and optimized backend APIs using Node.js and PostgreSQL, improving response time by 30%" |
| "Managed social media" | "Led social media strategy across 3 platforms, growing Instagram engagement 2x to 50K followers" |
| "Did data analysis" | "Built predictive analytics models in Python that identified $2M in cost savings opportunities" |

**ATS Optimization Rules:**
- Target **75-80% keyword alignment** with job description
- Use both acronyms and spelled-out terms ("Search Engine Optimization (SEO)")
- Mirror exact phrasing from JD where truthful
- Standard section headers: "Work Experience," "Education," "Skills"
- No tables, columns, graphics, or text boxes

### Region and industry-specific templates (NEW)

Resume conventions vary significantly by geography and industry:

**Geographic Variations:**

| Region | Photo | Length | Key Differences |
|--------|-------|--------|-----------------|
| US | ❌ Never | 1-2 pages | No personal info (age, marital status) |
| EU/UK | ⚠️ Optional | 2 pages | May include nationality, languages |
| Germany | ✅ Expected | 2-3 pages | Formal photo, detailed education |
| Asia | ✅ Common | 1-2 pages | May include personal details |

**Industry Variations:**

| Industry | Emphasis | Format | Special Considerations |
|----------|----------|--------|------------------------|
| Tech | Technical skills, GitHub | Clean, minimal | Keywords for ATS critical |
| Finance | Certifications, metrics | Conservative | CFA, CPA prominently displayed |
| Creative | Portfolio link, visual design | Can be creative | PDF with embedded links |
| Healthcare | Licenses, certifications | Traditional | State licenses, BLS/ACLS |
| Academia | Publications, grants | CV format (longer) | Reverse chronological publications |

### Multi-format output (EXPANDED)

**Standard Outputs:**
- **PDF:** ATS-optimized, print-ready
- **DOCX:** Editable for further customization
- **Plain Text:** Maximum ATS compatibility
- **HTML:** Web portfolio integration

**Social-Optimized Outputs (NEW):**
- **LinkedIn Summary:** 2,600 character limit, conversational tone, no formatting, keyword-rich for LinkedIn search
- **LinkedIn Headline:** 220 characters, value proposition focused
- **Twitter/X Bio:** 160 characters, punchy professional identity

**LinkedIn Summary Generation Rules:**
- First person, conversational tone
- Lead with value proposition, not job title
- Include 3-5 searchable keywords naturally
- End with call-to-action or contact invitation
- No bullet points or special characters

---

## User-facing workflow

### Six-step process

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Build Your Master Career Profile                                │
│  ────────────────────────────────────────                                │
│  • Upload existing resume/LinkedIn export                                │
│  • Connect GitHub, Credly accounts                                       │
│  • Answer guided questions about experience                              │
│  • Add personal projects and certifications                              │
│  → Output: Complete career database                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Upload or Paste Job Description                                 │
│  ───────────────────────────────────────                                 │
│  • Paste JD text or URL                                                  │
│  • System extracts requirements automatically                            │
│  • Review parsed skills and requirements                                 │
│  → Output: Structured job requirements                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Review Your Coverage Map                                        │
│  ────────────────────────────────                                        │
│  • See FULL / PARTIAL / GAP status for each requirement                  │
│  • Understand your overall match percentage                              │
│  • Identify which gaps matter most                                       │
│  → Output: Visual coverage assessment                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Answer Gap Questions                                            │
│  ────────────────────────────                                            │
│  • System asks targeted questions for gaps                               │
│  • Surface hidden relevant experience                                    │
│  • Add metrics to strengthen existing bullets                            │
│  → Output: Enriched experience database                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Review & Customize Suggestions                                  │
│  ─────────────────────────────────────                                   │
│  • System suggests most relevant experiences                             │
│  • AI rewrites bullets for impact and alignment                          │
│  • User approves, edits, or rejects suggestions                          │
│  → Output: Approved tailored content                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Generate Tailored Resume                                        │
│  ────────────────────────────────                                        │
│  • Select template (region/industry appropriate)                         │
│  • Generate PDF, DOCX, and LinkedIn summary                              │
│  • Download and apply                                                    │
│  → Output: Job-ready resume package                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technical architecture

### Privacy-first design

**Data Privacy Requirements:**
- GDPR: Opt-in consent, data subject rights (access, erasure, portability)
- CCPA/CPRA: Opt-out consent, specific retention timeframes
- Implementation: **Application-level encryption with user-held keys** (zero-knowledge architecture)

**Local-First Architecture:**
Technologies like RxDB enable client-side storage with encryption, reactive queries for instant UI updates, and optional sync to cloud backends. This addresses privacy concerns while improving UX.

### Recommended technology stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React/Vue + RxDB | Local-first UI with offline support |
| **Backend** | Node.js or Python | API, orchestration |
| **Primary DB** | MongoDB | Resume documents (nested structure) |
| **Relational DB** | PostgreSQL | Users, analytics, skill taxonomies |
| **Vector DB** | pgvector or Pinecone | Semantic skill matching |
| **Cache** | Redis | Skill taxonomy, LLM responses |
| **AI/ML** | Claude API + local models | Extraction, matching, generation |
| **PDF Gen** | Puppeteer on Lambda | Serverless PDF generation |

### LLM integration patterns

**Task-Appropriate Model Selection:**

| Task | Model | Rationale |
|------|-------|-----------|
| Simple parsing | Haiku | Fast, cheap, sufficient accuracy |
| Skill extraction | Sonnet | Balance of accuracy and cost |
| Gap questions | Sonnet | Conversational quality matters |
| Content rewriting | Sonnet/Opus | Quality critical for output |
| Complex analysis | Opus | Maximum reasoning capability |

**Cost Optimization:**
- Anthropic prompt caching: **90% savings** on cached system prompts
- Response caching: Key by prompt hash, 300s TTL
- Tiered processing: Rule-based first, LLM only when needed

### Human-in-the-loop safeguards

**Critical Principle:** AI should suggest content but never fabricate metrics, certifications, or company names.

**Checkpoint Pattern:**
1. User inputs raw experience → Auto-save
2. LLM generates draft content → Flag uncertain items
3. User reviews flagged items → Approve/edit/reject
4. Final generation with approved content only

**Confidence-Based Routing:**
- High confidence (>0.95): Auto-approve extraction
- Medium confidence (0.7-0.95): Flag for review
- Low confidence (<0.7): Require manual verification

---

## Quality metrics and success criteria

**System Performance:**
- Keyword match: Target 75-80% with job description
- ATS parse success: >95% on standard ATS systems
- User edit rate on AI generations: <30% (lower = better quality)
- Time to complete tailored resume: <15 minutes after initial profile

**User Outcomes:**
- Interview callback rate improvement (where trackable)
- User satisfaction scores
- Repeat usage for multiple applications

---

## Competitive differentiation

**What existing tools lack (opportunities):**

| Gap | Our Approach |
|-----|--------------|
| Shallow experience capture | Multi-modal input + conversational probing |
| Keyword-only matching | Semantic matching with 91% precision |
| No gap identification | Coverage map + intelligent questions |
| Generic AI content | Human-in-the-loop with user voice preservation |
| Single output format | Multi-format including LinkedIn-optimized |
| One-size-fits-all templates | Region and industry-specific customization |
| Privacy concerns | Local-first, user-controlled encryption |

---

## Implementation roadmap

**Phase 1 (MVP):** Experience capture + basic matching + single template generation
**Phase 2:** Coverage map UI + gap questions + multiple templates
**Phase 3:** External API integrations (GitHub, Credly) + LinkedIn summary generation
**Phase 4:** Region/industry templates + advanced analytics + outcome tracking

The three-phase architecture—experience capture, job-description matching, and tailored generation with gap analysis—creates a flywheel effect where each phase improves the others. Rich experience capture enables better matching; better matching identifies precise gaps; addressing gaps enriches the experience profile. This integrated approach, combined with privacy-first architecture and human-in-the-loop AI, positions a system to deliver genuinely useful resume creation that outperforms current market offerings.