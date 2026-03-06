export async function onRequestPost({ request, env }) {
    try {
        const { catalog_id, code, name, region, region_name, quantity, language, comment, is_extra, currentUserRole, currentUsername } = await request.json();

        if (!code || !name || !quantity) {
            return new Response(JSON.stringify({ error: 'Manglende data (kode, navn eller antal).' }), { status: 400 });
        }

        const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superuser';
        const approved = isAdmin ? 1 : 0;
        const status = isAdmin ? 'Bestilling' : 'Anmodning';

        const result = await env.DB.prepare(`
            INSERT INTO ordered_items (
                catalog_id, code, name, region, region_name, 
                quantity, language, comment, is_extra, 
                approved, status, ordered_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            catalog_id || null,
            code,
            name,
            region || 'da',
            region_name || 'Dansk',
            quantity,
            language || 'DA',
            comment || null,
            is_extra ? 1 : 0,
            approved,
            status,
            currentUsername || 'ukendt'
        ).run();

        // 2. Opret notifikation til admin
        const notifTitle = approved ? 'Ny Bestilling' : 'Ny Anmodning';
        const notifMsg = `${currentUsername || 'En bruger'} har ${approved ? 'bestilt' : 'anmodet om'} ${quantity}x ${name}`;

        await env.DB.prepare(`
            INSERT INTO notifications (type, title, message, link)
            VALUES (?, ?, ?, ?)
        `).bind('new_order', notifTitle, notifMsg, '/ordered').run();

        return new Response(JSON.stringify({
            success: true,
            message: approved ? 'Bestilling oprettet.' : 'Anmodning sendt til godkendelse.'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
