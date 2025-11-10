import { exec } from "child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = `backup-${timestamp}.sql`;
const command = `pg_dump --no-owner --no-privileges --format=plain --file=${file} "${databaseUrl}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup error: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`Backup warnings: ${stderr}`);
  }
  console.log(`Backup complete: ${file}`);
});


