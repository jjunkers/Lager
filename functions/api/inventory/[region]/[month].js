export async function onRequestGet({ params, env }) {
    const { region, month } = params;

    try {
        const results = await env.DB.prepare(
            'SELECT * FROM inventory WHERE region = ? AND month_key = ?'
        ).bind(region, month).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
