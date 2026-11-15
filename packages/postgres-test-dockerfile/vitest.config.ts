import path from "node:path";
import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";
import { seed } from "./src/tests/seed.js";

// Docker is not available inside the dev container
const isDevContainer = process.env.DEVCONTAINER === "true";

export default defineConfig({
	plugins: isDevContainer
		? []
		: [
				kyselyPostgres<DB>({
					config: {
						database: "testdb",
						username: "test",
						password: "test",
						port: 5434,
						dockerContainer: {
							dockerFile: path.resolve(__dirname, "Dockerfile"),
						},
					},
					migrationFolder: path.resolve(__dirname, "migrations"),
					seed,
				}),
			],
	test: {
		include: isDevContainer ? [] : ["src/**/*.spec.ts"],
		passWithNoTests: isDevContainer,
		testTimeout: 2500,
		coverage: {
			provider: "v8",
		},
	},
});
