export async function onRequestPost({ request, env }) {
    try {
        const { region, month_key, item_code, skab, lager, total, note, userRole } = await request.json();

        // Simple RBAC check
        if (userRole !== 'admin' && userRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer har tilladelse til at rette i lageret.' }), { status: 403 });
        }

        // Upsert logic (Insert or Update)
        const result = await env.DB.prepare(`
      INSERT INTO inventory (region, month_key, item_code, skab, lager, total, note, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(region, month_key, item_code) DO UPDATE SET
        skab = excluded.skab,
        lager = excluded.lager,
        total = excluded.total,
        note = excluded.note,
        updated_at = CURRENT_TIMESTAMP
    `).bind(region, month_key, item_code, skab, lager, total, note).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
