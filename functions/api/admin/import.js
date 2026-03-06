export async function onRequestPost({ request, env }) {
    try {
        const formData = await request.formData();
        const currentUserRole = formData.get('currentUserRole');

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan importere data.' }), { status: 403 });
        }

        const file = formData.get('file');
        if (!file) {
            return new Response(JSON.stringify({ error: 'Ingen fil uploadet' }), { status: 400 });
        }

        const text = await file.text();
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) {
            return new Response(JSON.stringify({ error: 'Filen er tom eller mangler data' }), { status: 400 });
        }

        // Simple CSV parser (assuming comma separator)
        const parseCSVRow = (row) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result;
        };

        const headers = parseCSVRow(rows[0]);
        const dataRows = rows.slice(1);

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Map regions for easy reference (based on export headers)
        // headers order: Kode, Navn (DA), Navn (NO), Navn (SV), Sektion, 
        // Dansk Skab, Dansk Lager, Dansk I alt, 
        // Norsk Skab, Norsk Lager, Norsk I alt, 
        // Svensk Skab, Svensk Lager, Svensk I alt

        const statements = [];

        for (const rowText of dataRows) {
            const values = parseCSVRow(rowText);
            if (values.length < 5) continue;

            const code = values[0];
            const nameDa = values[1];
            const nameNo = values[2];
            const nameSv = values[3];
            const section = values[4];

            // 1. Update Catalog info
            statements.push(
                env.DB.prepare(`
                    UPDATE catalog 
                    SET name_da = ?, name_no = ?, name_sv = ?, section = ? 
                    WHERE code = ?
                `).bind(nameDa, nameNo, nameSv, section, code)
            );

            // 2. Update Inventory for each region
            const regions = [
                { name: 'dansk', offset: 5 },
                { name: 'norsk', offset: 8 },
                { name: 'svensk', offset: 11 }
            ];

            for (const r of regions) {
                const skab = parseInt(values[r.offset]) || 0;
                const lager = parseInt(values[r.offset + 1]) || 0;
                const total = parseInt(values[r.offset + 2]) || 0;

                statements.push(
                    env.DB.prepare(`
                        INSERT OR REPLACE INTO inventory 
                        (region, month_key, item_code, skab, lager, total) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(r.name, monthKey, code, skab, lager, total)
                );
            }
        }

        // Execute all updates in a batch
        await env.DB.batch(statements);

        return new Response(JSON.stringify({
            success: true,
            message: `${dataRows.length} publikationer blev opdateret.`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
