import { readdirSync } from "fs";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import mysql, { Connection } from "mysql2/promise";

interface Migration {
  up(conn: Connection): Promise<void>;
}

const MIGRATIONS_DIR = resolve("migrations");
const TEST_DB = "migration_test_db";
const DB_CONFIG = { host: "localhost", user: "root", password: "test" };
const DROP_TEST_DB = `DROP DATABASE IF EXISTS ${TEST_DB}`;

const PASS = "\x1b[92m✓\x1b[0m";
const FAIL = "\x1b[91m✗\x1b[0m";

const label = (filename: string) => `${filename} `.padEnd(51, ".");

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

const hasUp = (value: unknown): value is Migration =>
  isObject(value) && "up" in value && typeof value.up === "function";

const unwrapDefault = (loaded: unknown): unknown =>
  isObject(loaded) && "default" in loaded ? loaded.default ?? loaded : loaded;

function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((filename) => filename.endsWith(".ts") && !filename.endsWith(".d.ts"))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));
}

async function loadMigration(filename: string): Promise<Migration> {
  const loaded: unknown = await import(pathToFileURL(join(MIGRATIONS_DIR, filename)).href);
  const candidate = unwrapDefault(loaded);
  if (!hasUp(candidate)) {
    throw new Error(`${filename} does not export an up function`);
  }
  return candidate;
}

async function runUntilFailure(conn: Connection, files: string[]): Promise<number> {
  for (const [index, filename] of files.entries()) {
    try {
      const migration = await loadMigration(filename);
      await migration.up(conn);
      console.log(`${label(filename)} ${PASS}`);
    } catch (error) {
      console.log(`${label(filename)} ${FAIL}  ERROR: ${errorMessage(error)}`);
      return index;
    }
  }
  return files.length;
}

async function main(): Promise<void> {
  const admin = await mysql.createConnection(DB_CONFIG);
  try {
    await admin.query(DROP_TEST_DB);
    await admin.query(`CREATE DATABASE ${TEST_DB}`);

    const conn = await mysql.createConnection({ ...DB_CONFIG, database: TEST_DB });
    try {
      const files = getMigrationFiles();
      const passed = await runUntilFailure(conn, files);
      const failed = passed < files.length ? 1 : 0;
      const skipped = files.length - passed - failed;

      console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
      process.exitCode = failed;
    } finally {
      await conn.end();
    }
  } finally {
    await admin.query(DROP_TEST_DB);
    await admin.end();
  }
}

main().catch((error) => {
  console.error(`${FAIL} Migration test aborted: ${errorMessage(error)}`);
  process.exitCode = 1;
});