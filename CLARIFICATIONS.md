# Clarification Questions for BetterResume Tech Spec

## Resolved

| Question | Answer |
|----------|--------|
| Deployment target | SaaS product |
| Scale expectations | 10-100 users (simplifies stack - can skip Redis, use single PostgreSQL with pgvector) |
| Local-first priority | Server-first approach for MVP (no RxDB complexity) |
| LinkedIn integration | Use LinkedIn API or web scrape (note: both have challenges - API requires partnership, scraping violates ToS) |
| GitHub scope | Repo metadata only (languages, stars, contribution frequency) - no code analysis |
| Conversational interface | Structured wizard with branching questions (not freeform AI chat) |
| Document upload formats | PDF, DOCX, plain text, LinkedIn PDF export |
| JD input method | Paste text only (no URL scraping - avoids legal/ToS issues) |
| Skill taxonomy source | Build custom taxonomy (no licensing costs, full control) |
| Skill extraction model | Use open-source tools (SkillNER, JobBERT) - no custom model training |
| Vector storage | pgvector sufficient (single DB simplicity for 10-100 users) |
| Match score transparency | Final percentage only (no formula breakdown shown to users) |
| Template engine | Document library (react-pdf or pdfmake) |
| User editing | Both: in-browser rich text editor AND DOCX download for external editing |
| LinkedIn summary | Generate copy for manual paste (no auto-posting) |
| Template count at MVP | One US tech template |
| LLM provider | Local LLM via Ollama (no cloud API dependency) |
| Fallback strategy | Local LLM is primary, no external fallback needed |
| Content guardrails | Never fabricate; Require explicit user affirmation for all performance metrics; Prevent semantic inflation; No emdash; No emojis; Require attribution for skill additions; Maintain provenance of all content; Prevent unearned seniority inflation |
| Target markets | US-only initially, but design for GDPR and CCPA compliance from start |
| Zero-knowledge scope | Server-side processing OK with encryption at rest (not zero-knowledge) |
| Data retention | Immediate full account deletion on user request (GDPR right to erasure) |
| Monetization model | Free tier + premium |
| MVP scope | Document upload parsing, Conversational capture (wizard), GitHub integration, Coverage map visualization, Gap questions |
| ATS testing | Deferred - rely on best practices for now |
| Success metrics tracking | Deferred |
| Existing assets | Greenfield (no existing code, designs, or research) |
| Cover letter generation | Yes - generate tailored cover letters (in scope) |
| Job search features | Deferred (out of MVP scope) |
| Interview prep | Deferred (out of MVP scope) |

---

All questions resolved.
