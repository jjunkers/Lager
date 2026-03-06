export async function onRequestPost({ request, env }) {
    try {
        const { searchParams } = new URL(request.url);
        const currentUserRole = searchParams.get('currentUserRole');

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan gendanne systemet.' }), { status: 403 });
        }

        const backup = await request.json();

        // Basic validation of backup format
        if (!backup.data || !backup.metadata) {
            return new Response(JSON.stringify({
                error: 'Ugyldig backup-fil. Filen mangler metadata eller data. Er du sikker på, at det er en .json fil fra dette system?'
            }), { status: 400 });
        }

        const tables = ['users', 'catalog', 'inventory', 'ordered_items'];
        const allStatements = [];

        console.log(`🚀 Starter gendannelse... Version: ${backup.metadata.version}, Dato: ${backup.metadata.timestamp}`);

        for (const table of tables) {
            if (backup.data[table]) {
                const data = backup.data[table];
                console.log(`📦 Behandler tabel: ${table} (${data.length} rækker)`);

                // Clear existing data
                allStatements.push(env.DB.prepare(`DELETE FROM ${table}`));

                // Insert new data
                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    const columnNames = columns.join(', ');
                    const placeholders = columns.map(() => '?').join(', ');

                    for (const row of data) {
                        const values = columns.map(col => row[col]);
                        allStatements.push(env.DB.prepare(`INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`).bind(...values));
                    }
                }
            }
        }

        if (allStatements.length > 0) {
            console.log(`⚡️ Kører ${allStatements.length} statements i chunks af 100...`);

            // Chunking logic: D1 has limits on batch size, so we split them up
            const chunkSize = 100;
            for (let i = 0; i < allStatements.length; i += chunkSize) {
                const chunk = allStatements.slice(i, i + chunkSize);
                await env.DB.batch(chunk);
                console.log(`✅ Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allStatements.length / chunkSize)} fuldført.`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Systemet er gendannet med ${allStatements.length} poster.`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('❌ Gendannelsesfejl:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
