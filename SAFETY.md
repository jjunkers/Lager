# Database Sikkerhedsprocedurer (SAFETY)

For at beskytte vores produktionsdata skal følgende procedurer altid følges ved arbejde med D1 databasen.

## 1. Altid Backup før ændringer
Før enhver kommando der ændrer data (`INSERT`, `UPDATE`, `DELETE`) eller kører en SQL-fil på `--remote`, skal der tages en backup.
```bash
npm run backup:prod
```
Alle backups gemmes i `/backups` mappen (ignoreret af Git).

## 2. Bekræft før kørsel
Før du kører en SQL-fil mod produktion, skal du verificere indholdet:
- Indeholder den `DELETE FROM` uden `WHERE`?
- Indeholder den test-data (f.eks. navne med `-d`, `-n` suffikser)?
- Er det den korrekte database (tjek `database_id` i `wrangler.toml`)?

## 3. Brug Miljø-specifikke kommandoer
Undgå at bruge `--remote` på generiske filer som `migrations/0003_seed_catalog.sql`, som er designet til at initialisere et tomt system. Brug i stedet specifikke opdaterings-scripts.

## 4. Verificering efter ændring
Efter enhver ændring skal der køres et kontrol-tjek:
```sql
SELECT count(*) FROM catalog; -- Bør matche det forventede antal
SELECT * FROM inventory WHERE month_key = '2026-02' LIMIT 1; -- Tjek om data stadig er der
```

## 5. Ved fejl
Hvis data utilsigtet slettes:
1. Stop alle yderligere database-operationer.
2. Find den nyeste fil i `/backups`.
3. Gendan data ved hjælp af `npx wrangler d1 execute lager-db --file backups/latest_backup.sql --remote`.
