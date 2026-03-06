export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan eksportere data.' }), { status: 403 });
    }

    try {
        // Fetch all catalog items
        const catalogResult = await env.DB.prepare('SELECT * FROM catalog ORDER BY section, sort_order').all();
        const catalog = catalogResult.results;

        // Fetch current inventory for all regions
        // We'll get the current month's key
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const inventoryResult = await env.DB.prepare(
            'SELECT * FROM inventory WHERE month_key = ?'
        ).bind(monthKey).all();
        const inventory = inventoryResult.results;

        // Map inventory to catalog items
        const dataMap = {};
        inventory.forEach(inv => {
            if (!dataMap[inv.item_code]) dataMap[inv.item_code] = {};
            dataMap[inv.item_code][inv.region] = inv;
        });

        // Generate CSV rows
        const headers = [
            'Kode', 'Navn (DA)', 'Navn (NO)', 'Navn (SV)', 'Sektion',
            'Dansk Skab', 'Dansk Lager', 'Dansk I alt',
            'Norsk Skab', 'Norsk Lager', 'Norsk I alt',
            'Svensk Skab', 'Svensk Lager', 'Svensk I alt'
        ];

        const rows = [headers.join(',')];

        catalog.forEach(item => {
            const invDa = dataMap[item.code]?.dansk || { skab: 0, lager: 0, total: 0 };
            const invNo = dataMap[item.code]?.norsk || { skab: 0, lager: 0, total: 0 };
            const invSv = dataMap[item.code]?.svensk || { skab: 0, lager: 0, total: 0 };

            const row = [
                `"${item.code}"`,
                `"${item.name_da || ''}"`,
                `"${item.name_no || ''}"`,
                `"${item.name_sv || ''}"`,
                `"${item.section || ''}"`,
                invDa.skab, invDa.lager, invDa.total,
                invNo.skab, invNo.lager, invNo.total,
                invSv.skab, invSv.lager, invSv.total
            ];
            rows.push(row.join(','));
        });

        const csvContent = rows.join('\n');

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="lager_export.csv"',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
