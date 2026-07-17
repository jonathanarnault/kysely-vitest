import type { Healthcheck } from "@kysely-vitest/core/docker.js";
import type { ConfigProvider } from "@kysely-vitest/core/plugin.js";
import type { ProvidedContext } from "vitest";

import type { POSTGRES_CONFIG_KEY } from "./dialect.js";

export const DEFAULT_DOCKER_IMAGE = "postgres";
export const DEFAULT_DOCKER_TAG = "latest";

export const DEFAULT_POSTGRES_DB = "testdb";
export const DEFAULT_POSTGRES_USER = "testuser";
export const DEFAULT_POSTGRES_PASSWORD = "test";
export const DEFAULT_POSTGRES_PORT = 5432;

export const RANDOM_PORT_MIN = 20000;
export const RANDOM_PORT_MAX = 50000;

/**
 * Picks a random host port in the [RANDOM_PORT_MIN, RANDOM_PORT_MAX] range.
 *
 * Used as the default host port when starting a Docker container so that
 * concurrent test runs don't collide on a fixed port.
 */
export function randomHostPort(): number {
	return (
		Math.floor(Math.random() * (RANDOM_PORT_MAX - RANDOM_PORT_MIN + 1)) +
		RANDOM_PORT_MIN
	);
}

/**
 * Default container healthcheck.
 *
 * `-h localhost` forces `pg_isready` to probe over TCP rather than the Unix
 * socket. Some images (e.g. `postgis/postgis`) boot a temporary socket-only
 * server to run their init scripts, during which a socket-based check already
 * reports ready — probing TCP avoids being marked healthy before the real
 * server is accepting connections.
 */
export const defaultHealthcheck = ({
	user,
}: HealthcheckConfig): Healthcheck => ({
	test: ["pg_isready", "-U", user, "-h", "localhost"],
	interval: "5s",
	timeout: "5s",
	retries: 5,
});

export const configProvider: ConfigProvider<
	typeof POSTGRES_CONFIG_KEY,
	PluginConfig
> = async ({ dockerContainer, ...config }) => {
	if (dockerContainer) {
		const port = config.port ?? randomHostPort();

		const database = config.database ?? DEFAULT_POSTGRES_DB;
		const user = config.user ?? DEFAULT_POSTGRES_USER;
		const password =
			(typeof config.password === "function"
				? await config.password()
				: config.password) || DEFAULT_POSTGRES_PASSWORD;

		const resolvedConfig = {
			host: "localhost",
			port,
			database,
			user,
			password,
		};

		const healthcheck: Healthcheck = {
			...defaultHealthcheck(resolvedConfig),
			...(dockerContainer !== true &&
			typeof dockerContainer.healthcheck === "function"
				? dockerContainer.healthcheck(resolvedConfig)
				: {}),
		};

		const baseContainer = {
			healthcheck,
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
		};

		if (
			dockerContainer !== true &&
			typeof dockerContainer.dockerFile === "string"
		) {
			const { dockerFile, image } = dockerContainer;
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
					dockerFile,
					...(image !== undefined && { image }),
					...baseContainer,
				},
			};
		}

		const image =
			dockerContainer === true
				? DEFAULT_DOCKER_IMAGE
				: (dockerContainer.image ?? DEFAULT_DOCKER_IMAGE);
		const tag =
			dockerContainer === true
				? DEFAULT_DOCKER_TAG
				: (dockerContainer.tag ?? DEFAULT_DOCKER_TAG);

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
				...baseContainer,
			},
		};
	}
	return {
		config,
		dockerContainer: false,
	};
};

/**
 * Resolved connection settings handed to a {@link HealthcheckProvider}.
 */
export type HealthcheckConfig = {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
};

/**
 * Builds a container healthcheck from the resolved Postgres connection config.
 *
 * The returned object is partial and merged over {@link defaultHealthcheck},
 * so only the fields to override need to be returned.
 */
export type HealthcheckProvider = (
	config: HealthcheckConfig,
) => Partial<Healthcheck>;

export type PluginConfig = ProvidedContext[typeof POSTGRES_CONFIG_KEY] & {
	dockerContainer?:
		| {
				image?: string;
				tag?: string;
				dockerFile?: never;
				healthcheck?: HealthcheckProvider;
		  }
		| {
				dockerFile: string;
				image?: string;
				tag?: never;
				healthcheck?: HealthcheckProvider;
		  }
		| true;
};
