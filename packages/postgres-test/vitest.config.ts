import path from "node:path";
import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		kyselyPostgres({
			config: {
				database: "testdb",
				username: "test",
				password: "test",
			},
			migrationFolder: path.resolve(__dirname, "migrations"),
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
