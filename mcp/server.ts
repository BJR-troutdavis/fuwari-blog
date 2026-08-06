import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url,
  authToken,
});

const server = new Server(
  {
    name: 'fuwari-turso-blog-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_posts',
        description: 'List all blog posts from the Turso database',
        inputSchema: {
          type: 'object',
          properties: {
            include_drafts: {
              type: 'boolean',
              description: 'Whether to include draft posts (default: false)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of posts to return (default: 50)',
            },
          },
        },
      },
      {
        name: 'get_post',
        description: 'Get a single blog post by slug or ID',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'The URL slug of the post',
            },
            id: {
              type: 'string',
              description: 'The unique ID of the post',
            },
          },
        },
      },
      {
        name: 'create_post',
        description: 'Create a new blog post in the Turso database',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'URL slug (e.g. my-first-post)' },
            title: { type: 'string', description: 'Title of the blog post' },
            content: { type: 'string', description: 'Markdown content of the post' },
            description: { type: 'string', description: 'Short summary or excerpt' },
            cover_image: { type: 'string', description: 'URL or path to cover image' },
            category: { type: 'string', description: 'Category name' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tags',
            },
            draft: { type: 'boolean', description: 'Is draft (default: false)' },
          },
          required: ['slug', 'title', 'content'],
        },
      },
      {
        name: 'update_post',
        description: 'Update an existing blog post by slug',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Slug of post to update' },
            title: { type: 'string' },
            content: { type: 'string' },
            description: { type: 'string' },
            cover_image: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            draft: { type: 'boolean' },
          },
          required: ['slug'],
        },
      },
      {
        name: 'delete_post',
        description: 'Delete a blog post from Turso by slug',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Slug of the post to delete' },
          },
          required: ['slug'],
        },
      },
      {
        name: 'get_analytics',
        description: 'Get view counts and post analytics from post_views table',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_sql',
        description: 'Execute custom SQL query on the Turso database',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL statement to execute' },
            args: { type: 'array', description: 'SQL parameters' },
          },
          required: ['sql'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'list_posts') {
      const includeDrafts = args?.include_drafts ?? false;
      const limit = Number(args?.limit) || 50;

      const query = includeDrafts
        ? 'SELECT id, slug, title, description, category, tags, draft, published_at FROM posts ORDER BY published_at DESC LIMIT ?'
        : 'SELECT id, slug, title, description, category, tags, draft, published_at FROM posts WHERE draft = 0 ORDER BY published_at DESC LIMIT ?';

      const result = await db.execute({ sql: query, args: [limit] });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    if (name === 'get_post') {
      const slug = args?.slug as string;
      const id = args?.id as string;

      if (!slug && !id) {
        throw new Error('Must provide either slug or id');
      }

      const query = slug
        ? 'SELECT * FROM posts WHERE slug = ?'
        : 'SELECT * FROM posts WHERE id = ?';

      const result = await db.execute({ sql: query, args: [slug || id] });

      if (result.rows.length === 0) {
        return {
          content: [
            { type: 'text', text: `Post not found for ${slug ? 'slug: ' + slug : 'id: ' + id}` },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.rows[0], null, 2),
          },
        ],
      };
    }

    if (name === 'create_post') {
      const slug = args?.slug as string;
      const title = args?.title as string;
      const content = args?.content as string;
      const description = (args?.description as string) || '';
      const cover_image = (args?.cover_image as string) || '';
      const category = (args?.category as string) || '';
      const tags = JSON.stringify(args?.tags || []);
      const draft = args?.draft ? 1 : 0;
      const id = 'post_' + Math.random().toString(36).substring(2, 11);

      await db.execute({
        sql: `INSERT INTO posts (id, slug, title, content, description, cover_image, category, tags, draft, published_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [id, slug, title, content, description, cover_image, category, tags, draft],
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully created post "${title}" (slug: ${slug}, id: ${id})`,
          },
        ],
      };
    }

    if (name === 'update_post') {
      const slug = args?.slug as string;
      const updates: string[] = [];
      const sqlArgs: any[] = [];

      if (args?.title !== undefined) {
        updates.push('title = ?');
        sqlArgs.push(args.title);
      }
      if (args?.content !== undefined) {
        updates.push('content = ?');
        sqlArgs.push(args.content);
      }
      if (args?.description !== undefined) {
        updates.push('description = ?');
        sqlArgs.push(args.description);
      }
      if (args?.cover_image !== undefined) {
        updates.push('cover_image = ?');
        sqlArgs.push(args.cover_image);
      }
      if (args?.category !== undefined) {
        updates.push('category = ?');
        sqlArgs.push(args.category);
      }
      if (args?.tags !== undefined) {
        updates.push('tags = ?');
        sqlArgs.push(JSON.stringify(args.tags));
      }
      if (args?.draft !== undefined) {
        updates.push('draft = ?');
        sqlArgs.push(args.draft ? 1 : 0);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      if (updates.length === 1) {
        throw new Error('No fields provided to update');
      }

      sqlArgs.push(slug);

      await db.execute({
        sql: `UPDATE posts SET ${updates.join(', ')} WHERE slug = ?`,
        args: sqlArgs,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated post with slug "${slug}"`,
          },
        ],
      };
    }

    if (name === 'delete_post') {
      const slug = args?.slug as string;

      await db.execute({
        sql: 'DELETE FROM posts WHERE slug = ?',
        args: [slug],
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted post with slug "${slug}"`,
          },
        ],
      };
    }

    if (name === 'get_analytics') {
      const result = await db.execute('SELECT * FROM post_views ORDER BY views DESC');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    if (name === 'execute_sql') {
      const sql = args?.sql as string;
      const sqlArgs = (args?.args as any[]) || [];

      const result = await db.execute({ sql, args: sqlArgs });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP Server error:', err);
  process.exit(1);
});
