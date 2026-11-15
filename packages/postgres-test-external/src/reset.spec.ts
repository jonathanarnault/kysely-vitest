import { resetDatabase } from "@kysely-vitest/postgres/reset.js";
import { type Kysely, sql } from "kysely";
import { describe, expect } from "vitest";
import type { DB } from "./db.js";
import { pgTest } from "./tests/pgTest.js";

describe("resetDatabase", () => {
	pgTest("should leave an empty public schema", async ({ db }) => {
		await resetDatabase(db, true);

		await expect(listTables(db, "public")).resolves.toEqual([]);
	});

	pgTest("should keep schemas that are not listed", async ({ db }) => {
		await createSchemaWithTable(db, "extra");

		await resetDatabase(db, true);

		await expect(listTables(db, "extra")).resolves.toEqual(["items"]);
	});

	pgTest("should drop the listed schemas", async ({ db }) => {
		await createSchemaWithTable(db, "extra");

		await resetDatabase(db, { schemas: ["extra"] });

		await expect(listSchemas(db, ["public", "extra"])).resolves.toEqual([
			"public",
		]);
	});
});

async function createSchemaWithTable(db: Kysely<DB>, schema: string) {
	await sql`CREATE SCHEMA ${sql.id(schema)}`.execute(db);
	await sql`CREATE TABLE ${sql.id(schema, "items")} (id serial)`.execute(db);
}

async function listTables(db: Kysely<DB>, schema: string): Promise<string[]> {
	const { rows } = await sql<{ name: string }>`
		SELECT table_name AS name FROM information_schema.tables
		WHERE table_schema = ${schema}
	`.execute(db);
	return rows.map(({ name }) => name);
}

async function listSchemas(
	db: Kysely<DB>,
	schemas: string[],
): Promise<string[]> {
	const { rows } = await sql<{ name: string }>`
		SELECT schema_name AS name FROM information_schema.schemata
		WHERE schema_name IN (${sql.join(schemas)})
	`.execute(db);
	return rows.map(({ name }) => name);
}
