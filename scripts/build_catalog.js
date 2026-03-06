import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const namesCsvPath = path.join(projectRoot, 'lager_udvidet_v2.csv');
const qtyCsvPath = path.join(projectRoot, 'lageropgoerelse_01-2026.csv');
const catalogOutputPath = path.join(projectRoot, 'src/data/catalog.js');

const readCsv = (filePath, separator) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(separator).map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i];
        });
        return obj;
    });
};

console.log('Reading CSVs...');
const namesData = readCsv(namesCsvPath, ';'); // Semicolon separated
const qtyData = readCsv(qtyCsvPath, ','); // Comma separated

console.log(`Loaded ${namesData.length} items from names CSV.`);
console.log(`Loaded ${qtyData.length} items from qty CSV.`);

// Create a map for quantities for easy lookup
const qtyMap = {};
qtyData.forEach(item => {
    if (item.code) {
        qtyMap[item.code] = {
            da: parseInt(item.da || '0'),
            no: parseInt(item.no || '0'),
            sv: parseInt(item.sv || '0')
        };
    }
});

// Merge data
const catalog = namesData.map(item => {
    const qtys = qtyMap[item.code] || { da: 0, no: 0, sv: 0 };
    return {
        section: item.section,
        code: item.code,
        name_no: item.name_no,
        name_da: item.name_da,
        name_sv: item.name_sv,
        quantity_da: qtys.da,
        quantity_no: qtys.no,
        quantity_sv: qtys.sv
    };
});

// Generate JS content
const fileContent = `export const catalog = ${JSON.stringify(catalog, null, 2)};
`;

fs.writeFileSync(catalogOutputPath, fileContent);
console.log(`Successfully wrote ${catalog.length} items to ${catalogOutputPath}`);
