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

BACKUP_FILE=$1 # First argument is the backup file path

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' not found!"
  exit 1
fi

echo "Starting PostgreSQL restore for database: $DB_NAME on host: $DB_HOST from: $BACKUP_FILE..."

# Perform the restore using pg_restore (or psql for .sql files)
PGPASSWORD="${DATABASE_URL#*:}"; PGPASSWORD="${PGPASSWORD%@*}" # Extract password
export PGPASSWORD

# Decompress if it's a gzipped file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
  echo "Restore successful from: $BACKUP_FILE"
else
  echo "Restore failed!"
  exit 1
fi

unset PGPASSWORD # Unset password for security

exit 0
