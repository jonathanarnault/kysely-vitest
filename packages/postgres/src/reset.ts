import type { ResetFunction } from "@kysely-vitest/core/types.js";
import { sql } from "kysely";

export const resetDatabase: ResetFunction<PostgresResetOptions> = async (
	db,
	options,
) => {
	const schemas = new Set([
		"public",
		...(options === true ? [] : (options.schemas ?? [])),
	]);

	for (const schema of schemas) {
		await sql`DROP SCHEMA IF EXISTS ${sql.id(schema)} CASCADE`.execute(db);
	}

	await sql`CREATE SCHEMA public`.execute(db);
};

export type PostgresResetOptions = true | { schemas?: string[] };
