#!/bin/zsh

# Indlæs account_id fra wrangler.toml eller miljøvariabel
ACCOUNT_ID="d79936dc75aadec7b5c762c04eef4a78"
DB_NAME="lager-db"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
PROJECT_ROOT="/Users/jorgenjunker/Desktop/Antigravity/Lager"
FILENAME="${PROJECT_ROOT}/backups/backup_${TIMESTAMP}.sql"

echo "🚀 Starter backup af ${DB_NAME}..."

# Kør wrangler d1 export
CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID npx wrangler d1 export $DB_NAME --remote --output $FILENAME

if [ $? -eq 0 ]; then
    echo "✅ Backup fuldført: ${FILENAME}"
    # Opret også en 'latest' reference
    cp $FILENAME "${PROJECT_ROOT}/backups/latest_backup.sql"
else
    echo "❌ Fejl under backup!"
    exit 1
fi
