import { describe } from "node:test";
import { pgTest } from "@kysely-vitest/postgres/test.js";
import { expect } from "vitest";

describe("db", () => {
	pgTest("it should select a value", async ({ db }) => {
		const result = await db
			.selectNoFrom(({ eb }) => eb.val("1").as("value"))
			.executeTakeFirstOrThrow();

		expect(result).toEqual({ value: "1" });
	});
});
