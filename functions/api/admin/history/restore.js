export async function onRequestPost({ request, env }) {
    try {
        const { id, currentUserRole } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan gendanne publikationer.' }), { status: 403 });
        }

        // 1. Find varen i historikken
        const historyItem = await env.DB.prepare('SELECT * FROM order_history WHERE id = ?').bind(id).first();
        if (!historyItem) {
            return new Response(JSON.stringify({ error: 'Publikationen blev ikke fundet i historikken.' }), { status: 404 });
        }

        // 2. Flyt tilbage til ordered_items
        // Vi nulstiller status til 'Bestilling' og sætter approved baseret på om den kom fra historik som slettet/modtaget
        // Men her fokuserer vi på 'Slettet' varer der skal tilbage.
        await env.DB.prepare(`
            INSERT INTO ordered_items (
                catalog_id, code, name, region, region_name, 
                quantity, language, ordered_by, ordered_at, 
                comment, approved, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            historyItem.catalog_id,
            historyItem.code,
            historyItem.name,
            historyItem.region,
            historyItem.region_name,
            historyItem.quantity,
            historyItem.language,
            historyItem.ordered_by,
            historyItem.ordered_at,
            historyItem.comment,
            1, // Antag at den var godkendt siden den var i flowet (eller vi ruller den tilbage som godkendt)
            'Bestilling'
        ).run();

        // 3. Slet fra historikken
        await env.DB.prepare('DELETE FROM order_history WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
