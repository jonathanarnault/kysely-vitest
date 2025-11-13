import { describe, expect } from "vitest";
import { pgTest } from "./tests/pgTest.js";

describe.sequential("db", () => {
	pgTest("it should create a user", async ({ db }) => {
		await expect(
			db
				.insertInto("users")
				.values({ username: "charlie" })
				.returningAll()
				.execute(),
		).resolves.toEqual([
			{
				id: expect.any(Number),
				username: "charlie",
			},
		]);

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
				{
					id: expect.any(Number),
					username: "charlie",
				},
			],
		);
	});

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
