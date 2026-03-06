export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan se historik.' }), { status: 403 });
    }

    try {
        const results = await env.DB.prepare(
            'SELECT * FROM order_history ORDER BY received_at DESC LIMIT 100'
        ).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
