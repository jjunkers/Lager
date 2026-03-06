export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ error: 'Manglende brugernavn' }), { status: 400 });
    }

    try {
        const results = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM ordered_items WHERE ordered_by = ?"
        ).bind(username).first();

        return new Response(JSON.stringify({
            user_active_orders: results.count || 0
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
