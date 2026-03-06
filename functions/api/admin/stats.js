export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Kun admin kan se disse stats for badges
    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Uautoriseret' }), { status: 403 });
    }

    try {
        // 1. Beregn mangler fra kataloget
        const catalogResults = await env.DB.prepare(
            'SELECT * FROM catalog WHERE min_stock > 0'
        ).all();

        const catalogItems = catalogResults.results;
        let da_shortages = 0;
        let no_shortages = 0;
        let sv_shortages = 0;

        catalogItems.forEach(item => {
            if (item.quantity_da < item.min_stock) da_shortages++;
            if (item.quantity_no < item.min_stock) no_shortages++;
            if (item.quantity_sv < item.min_stock) sv_shortages++;
        });

        const total_shortages = da_shortages + no_shortages + sv_shortages;

        // 2. Beregn afventende bestillinger (Mangler på lager + Nye anmodninger)
        const ordersResults = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM ordered_items WHERE status IN ('Anmodning', 'Bestilling')"
        ).first();
        const pending_orders = ordersResults.count || 0;
        const orders_count = total_shortages + pending_orders;

        // 3. Beregn publikationer i tracking-flowet (Publikationer bestilt ved HQ)
        const shippedResults = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM ordered_items WHERE status IN ('Bestilt', 'Afhentes')"
        ).first();
        const shipped_count = shippedResults.count || 0;

        // 4. Beregn ulæste notifikationer
        const notifResults = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM notifications WHERE is_read = 0"
        ).first();
        const unread_notifications = notifResults.count || 0;

        return new Response(JSON.stringify({
            total_shortages,
            da_shortages,
            no_shortages,
            sv_shortages,
            orders_count,
            shipped_count,
            unread_notifications
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
