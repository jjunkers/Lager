export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan tage backup.' }), { status: 403 });
    }

    try {
        const tables = ['users', 'catalog', 'inventory', 'ordered_items'];
        const backup = { data: {} };

        for (const table of tables) {
            const result = await env.DB.prepare(`SELECT * FROM ${table}`).all();
            backup.data[table] = result.results;
        }

        const now = new Date().toISOString();
        backup.metadata = {
            version: '1.0',
            timestamp: now,
            tables: tables
        };

        return new Response(JSON.stringify(backup, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': 'attachment; filename="lager_backup.json"',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (e) {
        console.error('Backup error:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
