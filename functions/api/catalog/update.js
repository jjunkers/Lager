export async function onRequestPost({ request, env }) {
    try {
        const { id, code, name_da, name_no, name_sv, section, description, min_stock, max_stock, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan rette i kataloget.' }), { status: 403 });
        }

        const result = await env.DB.prepare(`
      UPDATE catalog 
      SET code = ?, name_da = ?, name_no = ?, name_sv = ?, section = ?, description = ?, min_stock = ?, max_stock = ?
      WHERE id = ?
    `).bind(code, name_da, name_no, name_sv, section, description || null, min_stock || 0, max_stock || 0, id).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
