#!/bin/bash

# Load environment variables (assuming .env file is present in the project root or specified path)
if [ -f ../.env ]; then
  export $(cat ../.env | xargs)
fi

# Database connection details
DB_HOST=${DATABASE_URL#*@} # Extract host from DATABASE_URL
DB_HOST=${DB_HOST%:*} # Remove port
DB_PORT=5432 # Default PostgreSQL port
DB_USER=${DATABASE_URL#*//} # Extract user from DATABASE_URL
DB_USER=${DB_USER%:*} # Remove password
DB_NAME=${DATABASE_URL%?sslmode*} # Extract DB name from DATABASE_URL
DB_NAME=${DB_NAME##*/} # Remove everything before last slash

# Backup directory (create if it doesn't exist)
BACKUP_DIR="/var/backups/doorgo_db" # Example path, adjust as needed
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/doorgo_db_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting PostgreSQL backup for database: $DB_NAME on host: $DB_HOST..."

# Perform the backup using pg_dump
PGPASSWORD="${DATABASE_URL#*:}"; PGPASSWORD="${PGPASSWORD%@*}" # Extract password
export PGPASSWORD

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -c -O > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  # Optional: Compress the backup file
  gzip "$BACKUP_FILE"
  echo "Backup compressed: $BACKUP_FILE.gz"
  # Optional: Remove old backups (e.g., keep last 7 days)
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete
  echo "Old backups cleaned up."
else
  echo "Backup failed!"
  exit 1
fi

unset PGPASSWORD # Unset password for security

exit 0
