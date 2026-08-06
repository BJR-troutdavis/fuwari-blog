import type { APIRoute } from 'astro';
import { turso } from '../../lib/turso';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  try {
    if (slug) {
      const result = await turso.execute({
        sql: 'SELECT * FROM posts WHERE slug = ? AND draft = 0',
        args: [slug],
      });

      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result.rows[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await turso.execute(
      'SELECT id, slug, title, description, category, tags, cover_image, published_at FROM posts WHERE draft = 0 ORDER BY published_at DESC'
    );

    return new Response(JSON.stringify({ posts: result.rows }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
