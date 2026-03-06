export async function onRequestPost({ request, env }) {
    try {
        const { id, status, approved, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan opdatere status.' }), { status: 403 });
        }

        let query = 'UPDATE ordered_items SET updated_at = CURRENT_TIMESTAMP';
        const params = [];

        if (status) {
            query += ', status = ?';
            params.push(status);
        }

        if (approved !== undefined) {
            query += ', approved = ?';
            params.push(approved ? 1 : 0);

            // Hvis vi godkender, så sæt status til 'Bestilling' automatisk
            if (approved && !status) {
                query += ", status = 'Bestilling'";
            }
        }

        query += ' WHERE id = ?';
        params.push(id);

        await env.DB.prepare(query).bind(...params).run();

        // If we're approving an order, mark the related notification as read
        if (approved) {
            const orderedItem = await env.DB.prepare('SELECT name FROM ordered_items WHERE id = ?').bind(id).first();
            if (orderedItem) {
                await env.DB.prepare(
                    "UPDATE notifications SET is_read = 1 WHERE type = 'new_order' AND is_read = 0 AND message LIKE ?"
                ).bind(`%${orderedItem.name}%`).run();
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
