import { sql } from "kysely";
import { describe, expect } from "vitest";
import { pgTest } from "./tests/pgTest.js";

describe.sequential("db", () => {
	pgTest(
		"it should run migrations against a postgis container",
		async ({ db }) => {
			// If the container was reported healthy before TCP was ready, the
			// migration never ran and the schema is empty — this select then throws
			// instead of returning the seeded rows.
			await expect(
				db.selectFrom("places").selectAll().execute(),
			).resolves.toEqual([
				{ id: 1, name: "paris", location: null },
				{ id: 2, name: "london", location: null },
			]);
		},
	);

	pgTest("it should have the postgis extension available", async ({ db }) => {
		await expect(
			sql<{
				enabled: boolean;
			}>`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS enabled`.execute(
				db,
			),
		).resolves.toMatchObject({ rows: [{ enabled: true }] });
	});
});
