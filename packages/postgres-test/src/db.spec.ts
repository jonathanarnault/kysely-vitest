import { describe, expect } from "vitest";
import { pgTest } from "./pgTest.js";

describe("db", () => {
	pgTest("it should select a value", async ({ db }) => {
		await db.insertInto("users").values({ username: "alice" }).execute();

		expect(db.selectFrom("users").selectAll().execute()).resolves.toEqual([
			{
				id: expect.any(Number),
				username: "alice",
			},
		]);
	});
});
