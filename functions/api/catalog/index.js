export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const allowedRoles = ['admin', 'superuser', 'user', 'viewer'];
    if (!role || !allowedRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'Du skal være logget ind med en gyldig rolle for at se kataloget.' }), { status: 403 });
    }

    try {
        const results = await env.DB.prepare(
            'SELECT * FROM catalog ORDER BY sort_order ASC'
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
        const { currentUserRole, code, name_da, name_no, name_sv, section, sort_order, description, min_stock, max_stock } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan tilføje publikationer.' }), { status: 403 });
        }

        // Basic insert (could be enhanced with upsert if needed, but unique code handles dupes)
        const result = await env.DB.prepare(`
      INSERT INTO catalog (code, name_da, name_no, name_sv, section, sort_order, description, min_stock, max_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            code,
            name_da,
            name_no,
            name_sv,
            section,
            sort_order || 0,
            description || null,
            min_stock || 0,
            max_stock || 0
        ).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
