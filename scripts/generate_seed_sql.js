import { catalog } from '../src/data/catalog.js';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('migrations/0003_seed_catalog.sql');

let sql = '-- Seed catalog data\n';
sql += 'DELETE FROM catalog; -- Clear existing data\n';
sql += 'DELETE FROM sqlite_sequence WHERE name="catalog"; -- Reset ID\n\n';

catalog.forEach((item, index) => {
    // Escape values
    const safe = (val) => val ? `'${String(val).replace(/'/g, "''")}'` : 'NULL';
    const num = (val) => typeof val === 'number' ? val : 0;

    sql += `INSERT INTO catalog (code, name_da, name_no, name_sv, quantity_da, quantity_no, quantity_sv, section, sort_order) VALUES (${safe(item.code)}, ${safe(item.name_da)}, ${safe(item.name_no)}, ${safe(item.name_sv)}, ${num(item.quantity_da)}, ${num(item.quantity_no)}, ${num(item.quantity_sv)}, ${safe(item.section)}, ${index});\n`;
});

fs.writeFileSync(outputPath, sql);

console.log(`Generated seed SQL at ${outputPath} with ${catalog.length} items.`);
