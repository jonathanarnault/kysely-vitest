import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		kyselyPostgres({
			database: "testdb",
			username: "test",
			password: "test",
		}),
	],
	test: {
		include: ["src/**/*.spec.ts"],
		testTimeout: 2500,
		coverage: {
			provider: "v8",
		},
	},
});
