import type { ConfigProvider } from "@kysely-vitest/core/plugin.js";
import type { ProvidedContext } from "vitest";

import type { POSTGRES_CONFIG_KEY } from "./dialect.js";

export const DEFAULT_DOCKER_IMAGE = "postgres";
export const DEFAULT_DOCKER_TAG = "latest";

export const DEFAULT_POSTGRES_DB = "testdb";
export const DEFAULT_POSTGRES_USER = "testuser";
export const DEFAULT_POSTGRES_PASSWORD = "test";
export const DEFAULT_POSTGRES_PORT = 5432;

export const configProvider: ConfigProvider<
	typeof POSTGRES_CONFIG_KEY,
	PluginConfig
> = async ({ dockerContainer, ...config }) => {
	if (dockerContainer) {
		const image =
			dockerContainer === true
				? DEFAULT_DOCKER_IMAGE
				: (dockerContainer.image ?? DEFAULT_DOCKER_IMAGE);
		const tag =
			dockerContainer === true
				? DEFAULT_DOCKER_TAG
				: (dockerContainer.tag ?? DEFAULT_DOCKER_TAG);

		const port = config.port ?? DEFAULT_POSTGRES_PORT;

		const database = config.database ?? DEFAULT_POSTGRES_DB;
		const user = config.user ?? DEFAULT_POSTGRES_USER;
		const password =
			(typeof config.password === "function"
				? await config.password()
				: config.password) || DEFAULT_POSTGRES_PASSWORD;

		return {
			config: {
				...config,

				host: "localhost",
				port,

				database,
				user,
				password,
			},
			dockerContainer: {
				image,
				tag,
				healthcheck: {
					test: ["pg_isready", "-U", user],
					interval: "5s",
					timeout: "5s",
					retries: 5,
				},
				ports: [
					{
						hostPort: port,
						containerPort: DEFAULT_POSTGRES_PORT,
					},
				],
				environment: {
					POSTGRES_DB: database,
					POSTGRES_USER: user,
					POSTGRES_PASSWORD: password || DEFAULT_POSTGRES_PASSWORD,
				},
			},
		};
	}
	return {
		config,
		dockerContainer: false,
	};
};

export type PluginConfig = ProvidedContext[typeof POSTGRES_CONFIG_KEY] & {
	dockerContainer?:
		| {
				image?: typeof DEFAULT_DOCKER_IMAGE | string;
				tag?:
					| "18"
					| "18-alpine"
					| "17"
					| "17-alpine"
					| typeof DEFAULT_DOCKER_TAG
					| string;
		  }
		| true;
};
