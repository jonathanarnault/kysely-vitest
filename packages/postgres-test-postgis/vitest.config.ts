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
						port: 5435,
						dockerContainer: {
							// The postgis entrypoint boots a temporary socket-only server to
							// run its init scripts, during which a socket-based pg_isready
							// already reports ready. This is the image that exposes the
							// readiness race a plain `postgres` image inits too fast to hit.
							image: "postgis/postgis",
							tag: "17-3.5",
							healthcheck({ user }) {
								return {
									test: ["pg_isready", "-U", user, "-h", "localhost"],
									interval: "5s",
									timeout: "5s",
									retries: 5,
								};
							},
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
