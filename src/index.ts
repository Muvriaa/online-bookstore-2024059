/**
 * Online Bookstore — Week 15 starter Worker.
 *
 * Deliberately does NOT implement catalog, search, purchases, or a D1 schema.
 * Students develop those features from approved specifications in later labs.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        service: 'online-bookstore',
        phase: 'starter',
      });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        'Online Bookstore starter is running. Check GET /api/health.\n',
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });
  },
};
