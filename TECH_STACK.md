# BetterResume Tech Stack Documentation

## Overview

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 15+ (App Router) |
| Backend | Next.js API Routes | - |
| Database | PostgreSQL + pgvector | pgvector 0.8.1 |
| ORM | Prisma | Latest |
| Authentication | Supabase Auth | - |
| File Storage | Supabase Storage | - |
| Rich Text Editor | Lexical | - |
| PDF Generation | react-pdf | v4 |
| LLM | Ollama (local) | - |
| Deployment | Vercel | - |

---

## Next.js 15+

### Key Features
- **App Router**: Server Components, Server Actions, nested layouts
- **API Routes**: `/app/api/` for backend endpoints
- **Server Components**: Default for all components (use `'use client'` for client components)
- **Server Actions**: Direct database mutations without API routes
- **Middleware**: Request/response interception at edge

### Project Structure
```
app/
  layout.tsx          # Root layout
  page.tsx            # Home page
  api/
    route.ts          # API endpoints
  (auth)/
    login/page.tsx
    register/page.tsx
  dashboard/
    page.tsx
    layout.tsx
```

### Configuration
```js
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
  },
}
```

---

## Prisma ORM

### Setup
```bash
npx prisma init --datasource-provider postgresql
```

### Schema Example
```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  profile   Profile?
  resumes   Resume[]
}

model Profile {
  id           String @id @default(cuid())
  userId       String @unique
  user         User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  careerData   Json   // JSON Resume format
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobDesc   String   // Original job description
  content   Json     // Generated resume content
  matchScore Float?
  createdAt DateTime @default(now())
}
```

### Commands
```bash
npx prisma migrate dev --name init  # Create migration
npx prisma generate                  # Generate client
npx prisma studio                    # Visual editor
```

### Client Usage
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: { email: 'user@example.com' }
})

// Read
const users = await prisma.user.findMany({
  include: { profile: true }
})

// Update
await prisma.user.update({
  where: { id: 'xxx' },
  data: { email: 'new@example.com' }
})

// Delete (cascade deletes profile and resumes)
await prisma.user.delete({ where: { id: 'xxx' } })
```

---

## Supabase Auth

### Authentication Methods Supported
- Email/Password
- Magic Links (passwordless)
- OAuth: Google, GitHub, LinkedIn, Apple, etc.
- Phone (OTP via Twilio/MessageBird)

### Setup
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Client Setup
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Setup
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Auth Operations
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Get user
const { data: { user } } = await supabase.auth.getUser()
```

### Middleware (Route Protection)
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

---

## Supabase Storage

### Features
- S3-compatible storage
- Global CDN (285+ cities)
- On-the-fly image transformations
- Row-level security policies

### Setup
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(`${userId}/${filename}`, file, {
    contentType: file.type,
    upsert: false
  })

// Download file
const { data, error } = await supabase.storage
  .from('resumes')
  .download(`${userId}/${filename}`)

// Get public URL
const { data } = supabase.storage
  .from('resumes')
  .getPublicUrl(`${userId}/${filename}`)

// Delete file
const { error } = await supabase.storage
  .from('resumes')
  .remove([`${userId}/${filename}`])

// List files
const { data, error } = await supabase.storage
  .from('resumes')
  .list(userId, { limit: 100, offset: 0 })
```

### Bucket Policies (RLS)
```sql
-- Allow users to access only their own files
CREATE POLICY "Users can access own files"
ON storage.objects FOR ALL
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Lexical Editor

### Core Concepts
- **Editor Instance**: Created via `createEditor()`, attaches to contenteditable
- **Editor State**: Immutable data model (node tree + selection), JSON serializable
- **Nodes**: Building blocks (TextNode, ParagraphNode, custom nodes)
- **Commands**: Dispatched via `editor.dispatchCommand()`, handlers by priority
- **$ Functions**: Context-required functions (like `$getRoot()`) for state operations

### Setup
```bash
npm install lexical @lexical/react
```

### Basic Implementation
```tsx
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'

const theme = {
  paragraph: 'editor-paragraph',
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
  }
}

function Editor() {
  const initialConfig = {
    namespace: 'ResumeEditor',
    theme,
    onError: (error) => console.error(error),
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<div className="editor-placeholder">Enter text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={(editorState) => {
        const json = editorState.toJSON()
        // Save to database
      }} />
    </LexicalComposer>
  )
}
```

### Rich Text Features
```tsx
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'

const initialConfig = {
  namespace: 'ResumeEditor',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  theme,
  onError: (error) => console.error(error),
}
```

### Serialization
```typescript
// Save state
const editorState = editor.getEditorState()
const json = JSON.stringify(editorState.toJSON())

// Restore state
const newState = editor.parseEditorState(json)
editor.setEditorState(newState)
```

---

## react-pdf

### Purpose
React renderer for creating PDF files in browser and server.

### Setup
```bash
npm install @react-pdf/renderer
```

### Basic Usage
```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  section: {
    marginBottom: 10
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5
  },
  bullet: {
    fontSize: 12,
    marginLeft: 15
  }
})

const ResumeDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{data.name}</Text>
        <Text style={styles.text}>{data.email} | {data.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Experience</Text>
        {data.work.map((job, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.text}>{job.position} at {job.company}</Text>
            {job.highlights.map((h, j) => (
              <Text key={j} style={styles.bullet}>* {h}</Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
)

// Download link component
const DownloadButton = ({ data }) => (
  <PDFDownloadLink
    document={<ResumeDocument data={data} />}
    fileName="resume.pdf"
  >
    {({ loading }) => loading ? 'Generating...' : 'Download PDF'}
  </PDFDownloadLink>
)

// Generate on server
const generatePDF = async (data) => {
  const blob = await pdf(<ResumeDocument data={data} />).toBlob()
  return blob
}
```

### Custom Fonts
```typescript
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ]
})
```

---

## Ollama (Local LLM)

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Text completion |
| `/api/chat` | POST | Chat completion |
| `/api/embeddings` | POST | Generate embeddings |
| `/api/tags` | GET | List local models |
| `/api/pull` | POST | Download model |

### Chat Completion
```typescript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2',
    messages: [
      { role: 'system', content: 'You are a resume writing assistant.' },
      { role: 'user', content: 'Rewrite this bullet point for impact: "Did data analysis"' }
    ],
    stream: false,
    options: {
      temperature: 0.7
    }
  })
})

const data = await response.json()
console.log(data.message.content)
```

### Streaming Response
```typescript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3.2',
    messages: [...],
    stream: true
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = JSON.parse(decoder.decode(value))
  process.stdout.write(chunk.message.content)
}
```

### Generate Embeddings
```typescript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'nomic-embed-text',
    prompt: 'Python programming experience'
  })
})

const { embedding } = await response.json()
// embedding is number[] of 768 dimensions
```

### Structured Output (JSON)
```typescript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3.2',
    messages: [
      { role: 'user', content: 'Extract skills from: "5 years Python, AWS certified"' }
    ],
    format: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['skills']
    },
    stream: false
  })
})
```

### Recommended Models
| Use Case | Model | Size |
|----------|-------|------|
| General text | llama3.2 | 3B |
| Longer context | llama3.2:8b | 8B |
| Embeddings | nomic-embed-text | 137M |
| Code | codellama | 7B |

---

## pgvector

### Installation
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Vector Column Types
| Type | Max Dimensions | Use Case |
|------|----------------|----------|
| `vector(n)` | 2,000 | Standard embeddings |
| `halfvec(n)` | 4,000 | Memory-efficient |
| `bit(n)` | 64,000 | Binary vectors |
| `sparsevec` | 1,000 non-zero | Sparse representations |

### Schema with Prisma
```prisma
model Skill {
  id        String @id @default(cuid())
  name      String @unique
  embedding Unsupported("vector(768)")?
}
```

### Raw SQL for Vector Operations
```typescript
// Store embedding
await prisma.$executeRaw`
  UPDATE "Skill"
  SET embedding = ${embedding}::vector
  WHERE id = ${skillId}
`

// Similarity search
const similar = await prisma.$queryRaw`
  SELECT id, name, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM "Skill"
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`
```

### Distance Operators
| Operator | Distance Type | Index Op Class |
|----------|---------------|----------------|
| `<->` | L2 (Euclidean) | `vector_l2_ops` |
| `<=>` | Cosine | `vector_cosine_ops` |
| `<#>` | Inner product | `vector_ip_ops` |

### HNSW Index (Recommended)
```sql
-- Create index
CREATE INDEX ON skills
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Query-time tuning
SET hnsw.ef_search = 100;  -- Higher = better recall, slower
```

### Performance Tips
- Use HNSW for better speed-recall tradeoff
- Set `maintenance_work_mem` high during index creation
- Create index after bulk data load
- Use cosine distance (`<=>`) for normalized embeddings

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/betteresume?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Recommended Project Structure

```
betteresume/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx
      page.tsx
      profile/page.tsx
      jobs/[id]/page.tsx
    api/
      auth/callback/route.ts
      parse-resume/route.ts
      parse-jd/route.ts
      generate/route.ts
      embeddings/route.ts
  components/
    ui/
    editor/
    resume/
  lib/
    supabase/
      client.ts
      server.ts
    prisma.ts
    ollama.ts
    parsers/
      pdf.ts
      docx.ts
    matching/
      embeddings.ts
      coverage.ts
  prisma/
    schema.prisma
    migrations/
  public/
    fonts/
  types/
    json-resume.ts
```
