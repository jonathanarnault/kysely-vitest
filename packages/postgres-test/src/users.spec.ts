import { describe, expect } from "vitest";
import { pgTest } from "./tests/pgTest.js";

describe("db", () => {
	pgTest("it should select all users", async ({ db }) => {
		await expect(db.selectFrom("users").selectAll().execute()).resolves.toEqual(
			[
				{
					id: 1,
					username: "alice",
				},
				{
					id: 2,
					username: "bob",
				},
			],
		);
	});
});
