import path from "node:path";
import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";
import { seed } from "./src/tests/seed.js";

export default defineConfig({
	plugins: [
		kyselyPostgres<DB>({
			config: {
				database: "testdb",
				username: "test",
				password: "test",
			},
			migrationFolder: path.resolve(__dirname, "migrations"),
			seed,
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
