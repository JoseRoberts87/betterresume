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

---

## Open Questions

## Phase 2: Job Description Parsing

8. **JD input method**: Should users paste JD text only, or also support URL scraping from job boards (LinkedIn, Indeed, etc.)? URL scraping has legal/ToS implications.

9. **Skill taxonomy source**: The spec mentions EMSI/Lightcast. Should we license this, use an open-source alternative (ESCO, O*NET), or build a custom taxonomy?

10. **SkillNER vs custom model**: Should we use existing open-source tools (SkillNER, JobBERT) or plan to fine-tune custom models? Custom models require labeled training data.

## Phase 2.5: Matching Engine

11. **Vector storage**: For semantic matching, is pgvector sufficient or do you anticipate needing dedicated vector DB (Pinecone, Weaviate) for scale?

12. **Match score transparency**: Should users see the matching formula breakdown (semantic similarity %, keyword overlap %, etc.) or just the final percentage?

## Phase 3: Resume Generation

13. **Template engine**: Should templates be HTML/CSS-based (flexible, web-native) or use a document library (react-pdf, pdfmake)? This affects template creation workflow.

14. **User editing**: After AI generates content, how should users edit? In-browser rich text editor, download DOCX and edit externally, or both?

15. **LinkedIn summary**: Is auto-posting to LinkedIn in scope, or just generating copy for users to paste manually?

16. **Template count at MVP**: How many templates are needed for MVP? The spec mentions region/industry variations - is one good US tech template sufficient to start?

## AI/LLM Integration

17. **Claude model access**: Do you have existing Anthropic API access? Any budget constraints that affect model tier selection (Haiku vs Sonnet vs Opus)?

18. **Fallback strategy**: If Claude API is unavailable, should the system queue requests, use a fallback model (OpenAI, local LLM), or gracefully degrade?

19. **Content generation guardrails**: Beyond "never fabricate," what guardrails are needed? Should generated content be flagged if it significantly inflates user's stated experience?

## Privacy & Compliance

20. **Target markets**: Is this US-only initially, or must it be GDPR-compliant from day one? This affects architecture significantly.

21. **Zero-knowledge scope**: Should the server truly never see unencrypted resume data, or is server-side processing acceptable with encryption at rest?

22. **Data retention**: How long should user data be retained? Should users be able to delete their account and all data immediately?

## Product & Business

23. **Monetization model**: Free tier + premium, subscription, per-resume, or enterprise licensing? This affects feature gating design.

24. **MVP scope**: The spec outlines 4 implementation phases. For the true MVP (Phase 1), which features are must-have vs nice-to-have?
    - Document upload parsing?
    - Conversational capture?
    - GitHub/Credly integration?
    - Coverage map visualization?
    - Gap questions?

25. **Existing assets**: Are there any existing codebases, designs, or user research to build upon, or is this greenfield?

## Quality & Testing

26. **ATS testing**: How will we validate ">95% ATS parse success"? Do you have access to multiple ATS systems for testing, or should we rely on established best practices?

27. **Success metrics tracking**: Should the system track interview callbacks (requires user input) or focus on measurable in-app metrics only?

## Out of Scope Clarification

28. **Job search features**: Is job discovery/recommendations in scope, or strictly resume creation?

29. **Cover letter generation**: Should the system also generate tailored cover letters?

30. **Interview prep**: Any plans to extend into interview preparation (common questions, company research)?
