export async function onRequestPost({ request, env }) {
    try {
        const { items, currentUserRole } = await request.json(); // Array of { id, sort_order }

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan ændre rækkefølgen.' }), { status: 403 });
        }

        // D1 doesn't support massive batch updates nicely in one go without a loop or building a huge query.
        // We'll use a transaction if possible, or just individual updates for now.
        // Cloudflare D1 supports batch execution via batch()

        const statements = items.map(item =>
            env.DB.prepare('UPDATE catalog SET sort_order = ? WHERE id = ?').bind(item.sort_order, item.id)
        );

        const result = await env.DB.batch(statements);

        return new Response(JSON.stringify({ success: true, count: result.length }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
