import type { SeedFunction } from "@kysely-vitest/postgres/types.js";
import { sql } from "kysely";
import type { DB } from "../db.js";

export const seed: SeedFunction<DB> = async (db) => {
	await sql<void>`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`.execute(db);

	await db
		.insertInto("users")
		.values([{ username: "alice" }, { username: "bob" }])
		.execute();
};
