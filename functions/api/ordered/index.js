export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan se bestilte publikationer.' }), { status: 403 });
    }

    try {
        const results = await env.DB.prepare(
            'SELECT * FROM ordered_items ORDER BY approved ASC, status ASC, ordered_at DESC'
        ).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

// POST to receive an item
export async function onRequestPost({ request, env }) {
    try {
        const { id, catalog_id, region, quantity, currentUserRole, action } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan modtage eller slette publikationer.' }), { status: 403 });
        }

        // 1. Opdater lagerbeholdning i inventory-tabellen (KUN hvis vi ikke sletter)
        if (action !== 'delete' && catalog_id) {
            const normRegion = region?.toLowerCase();
            let inventoryRegion = '';
            if (normRegion === 'da' || normRegion === 'dansk') inventoryRegion = 'dansk';
            else if (normRegion === 'no' || normRegion === 'norsk') inventoryRegion = 'norsk';
            else if (normRegion === 'sv' || normRegion === 'svensk' || normRegion === 'z') inventoryRegion = 'svensk';

            if (!inventoryRegion) {
                return new Response(JSON.stringify({ error: `Ugyldig region for lageropdatering: ${region}` }), { status: 400 });
            }

            // Get the catalog base code (without region suffix) for inventory lookup
            const catalogItem = await env.DB.prepare('SELECT code FROM catalog WHERE id = ?').bind(catalog_id).first();
            if (!catalogItem) {
                return new Response(JSON.stringify({ error: 'Katalogvare ikke fundet.' }), { status: 404 });
            }
            const itemCode = catalogItem.code;

            // Current month key (YYYY-MM)
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Upsert inventory: add received quantity to lager
            const existing = await env.DB.prepare(
                'SELECT * FROM inventory WHERE region = ? AND month_key = ? AND item_code = ?'
            ).bind(inventoryRegion, monthKey, itemCode).first();

            if (existing) {
                const newLager = (existing.lager || 0) + quantity;
                const newTotal = (existing.skab || 0) + newLager;
                await env.DB.prepare(
                    'UPDATE inventory SET lager = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE region = ? AND month_key = ? AND item_code = ?'
                ).bind(newLager, newTotal, inventoryRegion, monthKey, itemCode).run();
            } else {
                await env.DB.prepare(
                    'INSERT INTO inventory (region, month_key, item_code, skab, lager, total) VALUES (?, ?, ?, 0, ?, ?)'
                ).bind(inventoryRegion, monthKey, itemCode, quantity, quantity).run();
            }
        }

        // 2. Arkiver i order_history før sletning
        const existingItem = await env.DB.prepare('SELECT * FROM ordered_items WHERE id = ?').bind(id).first();
        if (existingItem) {
            const historyStatus = action === 'delete' ? 'Slettet' : 'Modtaget';
            const { id: _, updated_at: __, ...historyData } = existingItem;
            await env.DB.prepare(`
                INSERT INTO order_history (
                    catalog_id, code, name, region, region_name, 
                    quantity, received_quantity, language, ordered_by, ordered_at, 
                    received_by, comment, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                historyData.catalog_id,
                historyData.code,
                historyData.name,
                historyData.region,
                historyData.region_name,
                historyData.quantity,
                action === 'delete' ? null : (quantity || historyData.quantity),
                historyData.language,
                historyData.ordered_by,
                historyData.ordered_at,
                currentUserRole || 'System',
                historyData.comment,
                historyStatus
            ).run();
        }

        // 3. Remove from ordered_items
        await env.DB.prepare('DELETE FROM ordered_items WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
