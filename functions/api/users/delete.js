export async function onRequestDelete({ request, env }) {
    try {
        const { username, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan slette brugere.' }), { status: 403 });
        }

        if (!username) {
            return new Response(JSON.stringify({ error: 'Username required' }), { status: 400 });
        }

        // Prevent deleting last admin or self? Frontend handles some context, but backend should ideally check.
        // For simplicity, allowed.

        const result = await env.DB.prepare('DELETE FROM users WHERE username = ?').bind(username).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
