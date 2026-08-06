import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const posts = [
  {
    slug: 'building-modern-edge-blog-astro-turso',
    title: 'Building a Modern Edge Blog with Astro, Turso SQLite, and AI Agents',
    description: 'A comprehensive deep dive into building an ultra-fast, serverless edge blog using Astro 5, Turso serverless SQLite, Vercel, and Model Context Protocol (MCP) AI management.',
    category: 'Engineering',
    tags: ['Astro', 'Turso', 'SQLite', 'Vercel', 'MCP', 'AI'],
    date: '2026-08-06',
    content: `# Building a Modern Edge Blog with Astro, Turso SQLite, and AI Agents

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

By unifying Astro's static build optimization with Turso's serverless edge SQLite and AI-assisted workflows, you get a blog platform that is blazing fast, simple to maintain, and future-proof.`
  },
  {
    slug: 'getting-started-with-fuwari-and-decap-cms',
    title: 'Getting Started with Fuwari & Decap CMS for Headless Publishing',
    description: 'Learn how to seamlessly integrate Decap CMS into Fuwari for visual, no-code publishing that commits directly to GitHub.',
    category: 'Guides',
    tags: ['CMS', 'DecapCMS', 'Astro', 'Workflow', 'NoCode'],
    date: '2026-08-05',
    content: `# Getting Started with Fuwari & Decap CMS for Headless Publishing

Headless CMS tools allow authors and non-technical editors to write, format, and publish articles visually while keeping all underlying content safely stored as Git-backed Markdown files.

---

## 🎨 What is Decap CMS?

**Decap CMS** (formerly Netlify CMS) is an open-source, Git-based content management system that integrates directly into static site generators like Astro.

### Key Features:
- **Visual Markdown Editor:** Write posts with rich formatting, headings, lists, and image uploads.
- **GitHub Authentication:** Secure single sign-on using your GitHub credentials.
- **Zero Database Server:** Posts are committed directly to your Git repository as clean Markdown files.

---

## 🛠 How Decap CMS Works in Fuwari

1. Navigate to your blog admin page at \`/admin/\`.
2. Authenticate with GitHub.
3. Edit or create new posts using the visual editor.
4. Click **Publish** — Vercel detects the new Git commit and deploys the update automatically within seconds!

---

## 💡 Best Practices for Content Editors

* **Use Descriptive Categories:** Keep your category naming consistent across posts.
* **Optimize Images:** Compress cover images before uploading for fast page loads.
* **Draft Mode:** Mark posts as drafts while drafting to prevent early publication.`
  },
  {
    slug: 'optimizing-web-performance-on-vercel-edge',
    title: 'Optimizing Web Performance & Sub-10ms Latency on Vercel Edge',
    description: 'Explore architectural techniques for achieving 100/100 Lighthouse scores and lightning-fast worldwide responses using Vercel Edge and distributed databases.',
    category: 'Performance',
    tags: ['Performance', 'Vercel', 'Edge', 'WebDev', 'Lighthouse'],
    date: '2026-08-04',
    content: `# Optimizing Web Performance & Sub-10ms Latency on Vercel Edge

Page speed directly impacts user engagement, SEO rankings, and conversion rates. In this guide, we break down actionable steps to achieve perfect 100/100 performance metrics on Lighthouse.

---

## ⚡ Core Web Vitals Checklist

1. **LCP (Largest Contentful Paint):** Sub 1.2 seconds by preloading key assets and inline CSS.
2. **FID / INP (Interaction to Next Paint):** Minimize JavaScript payloads on the client.
3. **CLS (Cumulative Layout Shift):** Specify image width and height attributes explicitly.

---

## 🚀 Edge Network Optimization Strategies

### 1. Static Site Generation (SSG) First
Pre-render all blog pages into static HTML during build time. Static pages serve directly from Vercel's global CDN edge servers.

### 2. Edge API Routes for Dynamic Views
Use lightweight serverless edge endpoints for view counters, search, and dynamic database lookups.

\`\`\`typescript
export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate" }
  });
};
\`\`\`

---

## 🎯 Conclusion

With Astro's island architecture and Vercel's Edge Network, your site delivers instant response times anywhere in the world.`
  }
];

async function publishAll() {
  for (const post of posts) {
    const id = 'post_' + Math.random().toString(36).substring(2, 11);

    // 1. Insert into Turso DB
    await db.execute({
      sql: `INSERT INTO posts (id, slug, title, content, description, category, tags, draft, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            ON CONFLICT(slug) DO UPDATE SET
              title = excluded.title,
              content = excluded.content,
              description = excluded.description,
              category = excluded.category,
              tags = excluded.tags,
              updated_at = CURRENT_TIMESTAMP`,
      args: [id, post.slug, post.title, post.content, post.description, post.category, JSON.stringify(post.tags), post.date],
    });
    console.log('✅ Published to Turso DB:', post.slug);

    // 2. Create static Markdown file for Astro
    const mdContent = `---
title: "${post.title}"
published: ${post.date}
description: "${post.description}"
tags: ${JSON.stringify(post.tags)}
category: "${post.category}"
draft: false
---

${post.content}
`;

    const mdPath = path.resolve(process.cwd(), `src/content/posts/${post.slug}.md`);
    fs.writeFileSync(mdPath, mdContent);
    console.log('✅ Created Markdown file:', mdPath);
  }
}

publishAll().catch(console.error);
