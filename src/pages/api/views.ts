import type { APIRoute } from 'astro';
import { turso } from '../../lib/turso';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await turso.execute({
      sql: 'SELECT views FROM post_views WHERE slug = ?',
      args: [slug],
    });

    const views = result.rows.length > 0 ? (result.rows[0].views as number) : 0;

    return new Response(JSON.stringify({ slug, views }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await turso.execute({
      sql: `INSERT INTO post_views (slug, views) VALUES (?, 1)
            ON CONFLICT(slug) DO UPDATE SET views = views + 1, updated_at = CURRENT_TIMESTAMP`,
      args: [slug],
    });

    const result = await turso.execute({
      sql: 'SELECT views FROM post_views WHERE slug = ?',
      args: [slug],
    });

    const views = result.rows.length > 0 ? (result.rows[0].views as number) : 1;

    return new Response(JSON.stringify({ slug, views }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
