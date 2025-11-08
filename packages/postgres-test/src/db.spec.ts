import { describe } from "node:test";
import { pgTest } from "@kysely-vitest/postgres/test.js";
import { expect } from "vitest";

describe("db", () => {
	pgTest("test", async ({ db }) => {
		expect(db).toBe("a");
	});
});
