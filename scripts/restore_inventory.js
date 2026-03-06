import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Import catalog using dynamic import to handle ESM if needed or just read as JSON string processing
const catalogPath = path.join(projectRoot, 'src/data/catalog.js');
const catalogFileContent = fs.readFileSync(catalogPath, 'utf-8');
// Simple extraction of the array since it's "export const catalog = [...]"
const jsonString = catalogFileContent.substring(catalogFileContent.indexOf('['), catalogFileContent.lastIndexOf(']') + 1);
const catalog = JSON.parse(jsonString);

const months = ['2025-11', '2025-12', '2026-01', '2026-02'];
const regions = ['dansk', 'norsk', 'svensk'];

let sql = '-- Restore inventory data\n';
sql += 'DELETE FROM inventory;\n\n';

catalog.forEach(item => {
    regions.forEach(region => {
        const qtyKey = region === 'dansk' ? 'quantity_da' : (region === 'norsk' ? 'quantity_no' : 'quantity_sv');
        const qty = item[qtyKey] || 0;

        months.forEach(month => {
            sql += `INSERT OR REPLACE INTO inventory (region, month_key, item_code, skab, lager, total) VALUES ('${region}', '${month}', '${item.code}', 0, ${qty}, ${qty});\n`;
        });
    });
});

const outputPath = path.join(projectRoot, 'migrations/restore_inventory.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Generated ${outputPath} with ${catalog.length * regions.length * months.length} entries.`);
