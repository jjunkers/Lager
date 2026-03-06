export async function onRequestDelete({ request, env }) {
    try {
        const { id, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan slette publikationer.' }), { status: 403 });
        }

        const result = await env.DB.prepare('DELETE FROM catalog WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
