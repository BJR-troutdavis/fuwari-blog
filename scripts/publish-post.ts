import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const slug = 'building-modern-edge-blog-astro-turso';
const title = 'Building a Modern Edge Blog with Astro, Turso SQLite, and AI Agents';
const description = 'A comprehensive deep dive into building an ultra-fast, serverless edge blog using Astro 5, Turso serverless SQLite, Vercel, and Model Context Protocol (MCP) AI management.';
const category = 'Engineering';
const tags = ['Astro', 'Turso', 'SQLite', 'Vercel', 'MCP', 'AI'];

const content = `# Building a Modern Edge Blog with Astro, Turso SQLite, and AI Agents

Modern web publishing demands ultra-fast page loads, effortless content management, and robust infrastructure. In this article, we explore how combining **Astro 5**, **Turso (LibSQL)**, **Vercel Edge Functions**, and **Model Context Protocol (MCP)** creates an invincible stack for modern content platforms.

---

## 🚀 The Architecture Stack

Our stack leverages serverless edge technology for maximum speed and zero maintenance:

* **Frontend Framework:** [Astro 5](https://astro.build) — Zero JS by default with hybrid SSG/SSR capabilities.
* **Database:** [Turso](https://turso.tech) — Distributed serverless SQLite powered by LibSQL.
* **Hosting:** [Vercel](https://vercel.com) — Edge network with automatic deployment.
* **AI Orchestration:** [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — Native AI management for headless blogging.

---

## ⚡ Why Turso for Edge Database Storage?

Traditional PostgreSQL or MySQL databases introduce connection pooling issues and latency overhead when called from serverless edge environments. 

Turso solves this by running lightweight SQLite databases distributed across edge locations:

\`\`\`typescript
import { createClient } from '@libsql/client';

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
\`\`\`

### Key Benefits:
1. **Sub-10ms Latency:** Reads happen close to your users worldwide.
2. **Simple SQL:** Pure SQLite syntax without complex ORM overhead.
3. **Cost Effective:** Generous free tier with billions of reads per month.

---

## 🤖 Managing Content with AI Agents & MCP

With our custom **MCP Server**, AI assistants can manage blog posts, track analytics, and run database migrations directly from natural language prompts:

\`\`\`bash
# Example MCP tool execution
create_post({
  title: "Building a Modern Edge Blog",
  slug: "building-modern-edge-blog-astro-turso",
  category: "Engineering"
})
\`\`\`

---

## 🛠 Conclusion

By unifying Astro's static build optimization with Turso's serverless edge SQLite and AI-assisted workflows, you get a blog platform that is blazing fast, simple to maintain, and future-proof.`;

async function main() {
  const id = 'post_' + Math.random().toString(36).substring(2, 11);

  // 1. Save to Turso Database
  await db.execute({
    sql: `INSERT INTO posts (id, slug, title, content, description, category, tags, draft, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(slug) DO UPDATE SET
            title = excluded.title,
            content = excluded.content,
            description = excluded.description,
            category = excluded.category,
            tags = excluded.tags,
            updated_at = CURRENT_TIMESTAMP`,
    args: [id, slug, title, content, description, category, JSON.stringify(tags), 0],
  });
  console.log('✅ Successfully published post to Turso DB:', slug);

  // 2. Create static Markdown file for Astro Content Collections
  const mdContent = `---
title: "${title}"
published: 2026-08-06
description: "${description}"
tags: ${JSON.stringify(tags)}
category: "${category}"
draft: false
---

${content}
`;

  const mdPath = path.resolve(process.cwd(), 'src/content/posts/building-modern-edge-blog-astro-turso.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log('✅ Created Markdown file at:', mdPath);
}

main().catch(console.error);
