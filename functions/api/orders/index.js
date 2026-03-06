export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan se bestillinger.' }), { status: 403 });
    }

    try {
        // Fetch all catalog items that have thresholds set
        const results = await env.DB.prepare(
            'SELECT * FROM catalog WHERE min_stock > 0 AND max_stock > 0'
        ).all();

        const items = results.results;
        const orders = [];

        // Helper to strip language suffix from catalog code
        const stripSuffix = (code) => code ? code.replace(/-(d|n|z)$/i, '') : '';

        items.forEach(item => {
            // Check each regional quantity against the threshold
            if (item.quantity_da < item.min_stock) {
                orders.push({
                    item_id: item.id,
                    code: stripSuffix(item.code) + '-d',
                    name: item.name_da || item.code,
                    description: item.description,
                    region: 'da',
                    region_name: 'Dansk',
                    current: item.quantity_da,
                    min: item.min_stock,
                    target: item.max_stock,
                    needed: item.max_stock
                });
            }
            if (item.quantity_no < item.min_stock) {
                orders.push({
                    item_id: item.id,
                    code: stripSuffix(item.code) + '-n',
                    name: item.name_no || item.code,
                    description: item.description,
                    region: 'no',
                    region_name: 'Norsk',
                    current: item.quantity_no,
                    min: item.min_stock,
                    target: item.max_stock,
                    needed: item.max_stock
                });
            }
            if (item.quantity_sv < item.min_stock) {
                orders.push({
                    item_id: item.id,
                    code: stripSuffix(item.code) + '-z',
                    name: item.name_sv || item.code,
                    description: item.description,
                    region: 'sv',
                    region_name: 'Svensk',
                    current: item.quantity_sv,
                    min: item.min_stock,
                    target: item.max_stock,
                    needed: item.max_stock
                });
            }
        });

        // Optional: Sort orders by code or region
        orders.sort((a, b) => a.code.localeCompare(b.code));

        return new Response(JSON.stringify(orders), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
