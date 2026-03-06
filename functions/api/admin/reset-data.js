export async function onRequestPost({ request, env }) {
    try {
        const { currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan nulstille data.' }), { status: 403 });
        }
        // Simple security: check for admin role (in a real app, we'd verify the JWT/session)
        // For now, we assume the frontend sends the role or we verify it here if possible.
        // Actually, let's keep it simple as requested for this environment.

        // 1. Clear all inventory counts (this resets everything to 0 for all regions/months)
        await env.DB.prepare('DELETE FROM inventory').run();

        // 2. Clear items (historical/transient items)
        await env.DB.prepare('DELETE FROM items').run();

        // 3. Clear ordered items
        await env.DB.prepare('DELETE FROM ordered_items').run();

        // 4. Clear order history
        await env.DB.prepare('DELETE FROM order_history').run();

        // 5. Clear notifications
        await env.DB.prepare('DELETE FROM notifications').run();

        // 6. Reset catalog cached quantities
        await env.DB.prepare(`
            UPDATE catalog 
            SET quantity_da = 0, 
                quantity_no = 0, 
                quantity_sv = 0
        `).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Alle test-data er blevet nulstillet.'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
