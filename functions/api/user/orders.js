export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ error: 'Manglende brugernavn' }), { status: 400 });
    }

    try {
        const results = await env.DB.prepare(
            "SELECT * FROM ordered_items WHERE ordered_by = ? ORDER BY ordered_at DESC"
        ).bind(username).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
