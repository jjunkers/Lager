export async function onRequestPost({ request, env }) {
    try {
        const { shortages, requestIds, currentUserRole, user } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan flytte bestillinger.' }), { status: 403 });
        }

        const batch = [];
        const orderedBy = user?.full_name || user?.username || 'System';

        // 1. Opret nye tracking-punkter for automatiske mangler
        if (shortages && Array.isArray(shortages)) {
            const shortageStmt = env.DB.prepare(`
                INSERT INTO ordered_items (catalog_id, code, name, region, region_name, quantity, status, approved, ordered_by)
                VALUES (?, ?, ?, ?, ?, ?, 'Bestilt', 1, ?)
            `);
            shortages.forEach(item => {
                batch.push(shortageStmt.bind(
                    item.item_id,
                    item.code,
                    item.description || item.name,
                    item.region,
                    item.region_name,
                    item.needed,
                    orderedBy
                ));
            });
        }

        // 2. Opdater status for eksisterende godkendte anmodninger
        if (requestIds && Array.isArray(requestIds) && requestIds.length > 0) {
            const updateStmt = env.DB.prepare(`
                UPDATE ordered_items SET status = 'Bestilt', updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `);
            requestIds.forEach(id => {
                batch.push(updateStmt.bind(id));
            });
        }

        if (batch.length > 0) {
            await env.DB.batch(batch);
        }

        return new Response(JSON.stringify({ success: true, count: batch.length }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
