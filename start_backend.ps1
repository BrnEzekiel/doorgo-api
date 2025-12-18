$env:DATABASE_URL="postgresql://postgres.gjfmdnwfpcfchjvvcoid:kawangware1@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
$env:PORT="3001"
npm run start:prod
# Keep the window open after the script finishes, useful for debugging
Read-Host -Prompt "Press Enter to close this window"