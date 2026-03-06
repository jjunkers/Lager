export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan se notifikationer.' }), { status: 403 });
    }

    try {
        const results = await env.DB.prepare(
            'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
        ).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const { id, markAllAsRead, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan markere notifikationer.' }), { status: 403 });
        }

        if (markAllAsRead) {
            await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
        } else if (id) {
            await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(id).run();
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
