import { describe, expect, it } from "vitest";
import type { PluginConfig } from "./config.js";
import {
	configProvider,
	DEFAULT_DOCKER_IMAGE,
	DEFAULT_DOCKER_TAG,
	DEFAULT_POSTGRES_DB,
	DEFAULT_POSTGRES_PASSWORD,
	DEFAULT_POSTGRES_PORT,
	DEFAULT_POSTGRES_USER,
} from "./config.js";

describe("configProvider", () => {
	describe("without dockerContainer", () => {
		it("returns config unchanged when dockerContainer is not provided", async () => {
			const config: PluginConfig = {
				host: "external-host",
				port: 5433,
				database: "mydb",
				user: "myuser",
				password: "mypass",
			};

			const result = await configProvider(config);

			expect(result).toEqual({
				config,
				dockerContainer: false,
			});
		});

		it("returns config unchanged when dockerContainer is undefined", async () => {
			const config: PluginConfig = {
				host: "external-host",
				port: 5433,
				database: "mydb",
				user: "myuser",
				password: "mypass",
			};

			const result = await configProvider(config);

			expect(result).toEqual({
				config,
				dockerContainer: false,
			});
		});
	});

	describe("with dockerContainer = true", () => {
		it("uses default values when dockerContainer is true and no other config provided", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
			};

			const result = await configProvider(config);

			expect(result).toEqual({
				config: {
					host: "localhost",
					port: DEFAULT_POSTGRES_PORT,
					database: DEFAULT_POSTGRES_DB,
					user: DEFAULT_POSTGRES_USER,
					password: DEFAULT_POSTGRES_PASSWORD,
				},
				dockerContainer: {
					image: DEFAULT_DOCKER_IMAGE,
					tag: DEFAULT_DOCKER_TAG,
					healthcheck: {
						test: ["pg_isready", "-U", DEFAULT_POSTGRES_USER],
						interval: "5s",
						timeout: "5s",
						retries: 5,
					},
					ports: [
						{
							hostPort: DEFAULT_POSTGRES_PORT,
							containerPort: DEFAULT_POSTGRES_PORT,
						},
					],
					environment: {
						POSTGRES_DB: DEFAULT_POSTGRES_DB,
						POSTGRES_USER: DEFAULT_POSTGRES_USER,
						POSTGRES_PASSWORD: DEFAULT_POSTGRES_PASSWORD,
					},
				},
			});
		});

		it.each([
			{
				configOverride: { database: "customdb" },
				expectedDatabase: "customdb",
				expectedUser: DEFAULT_POSTGRES_USER,
				expectedPort: DEFAULT_POSTGRES_PORT,
			},
			{
				configOverride: { user: "customuser" },
				expectedDatabase: DEFAULT_POSTGRES_DB,
				expectedUser: "customuser",
				expectedPort: DEFAULT_POSTGRES_PORT,
			},
			{
				configOverride: { port: 5555 },
				expectedDatabase: DEFAULT_POSTGRES_DB,
				expectedUser: DEFAULT_POSTGRES_USER,
				expectedPort: 5555,
			},
		])(
			"overrides defaults with $configOverride",
			async ({
				configOverride,
				expectedDatabase,
				expectedUser,
				expectedPort,
			}) => {
				const config: PluginConfig = {
					dockerContainer: true,
					...configOverride,
				};

				const result = await configProvider(config);

				expect(result.config.database).toBe(expectedDatabase);
				expect(result.config.user).toBe(expectedUser);
				expect(result.config.port).toBe(expectedPort);
			},
		);

		it("handles password as a string", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
				password: "custompass",
			};

			const result = await configProvider(config);

			expect(result.config.password).toBe("custompass");
			if (result.dockerContainer !== false) {
				expect(result.dockerContainer.environment?.POSTGRES_PASSWORD).toBe(
					"custompass",
				);
			}
		});

		it("handles password as an async function", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
				password: async () => "async-password",
			};

			const result = await configProvider(config);

			expect(result.config.password).toBe("async-password");
			if (result.dockerContainer !== false) {
				expect(result.dockerContainer.environment?.POSTGRES_PASSWORD).toBe(
					"async-password",
				);
			}
		});

		it("uses custom port for both host and docker configuration", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
				port: 5555,
			};

			const result = await configProvider(config);

			expect(result.config.port).toBe(5555);
			if (result.dockerContainer !== false) {
				expect(result.dockerContainer.ports).toEqual([
					{
						hostPort: 5555,
						containerPort: DEFAULT_POSTGRES_PORT,
					},
				]);
			}
		});

		it("updates healthcheck test with custom user", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
				user: "customuser",
			};

			const result = await configProvider(config);

			if (result.dockerContainer !== false) {
				expect(result.dockerContainer.healthcheck?.test).toEqual([
					"pg_isready",
					"-U",
					"customuser",
				]);
			}
		});
	});

	describe("with dockerContainer object", () => {
		it.each([
			{
				dockerConfig: { image: DEFAULT_DOCKER_IMAGE },
				expectedImage: DEFAULT_DOCKER_IMAGE,
				expectedTag: DEFAULT_DOCKER_TAG,
			},
			{
				dockerConfig: { image: "postgis/postgis" },
				expectedImage: "postgis/postgis",
				expectedTag: DEFAULT_DOCKER_TAG,
			},
			{
				dockerConfig: { tag: "17-alpine" },
				expectedImage: DEFAULT_DOCKER_IMAGE,
				expectedTag: "17-alpine",
			},
			{
				dockerConfig: { image: "custom-postgres", tag: "18" },
				expectedImage: "custom-postgres",
				expectedTag: "18",
			},
		])(
			"uses image=$expectedImage and tag=$expectedTag when dockerContainer is $dockerConfig",
			async ({ dockerConfig, expectedImage, expectedTag }) => {
				const config: PluginConfig = {
					dockerContainer: dockerConfig,
				};

				const result = await configProvider(config);

				if (result.dockerContainer !== false) {
					expect(result.dockerContainer.image).toBe(expectedImage);
					expect(result.dockerContainer.tag).toBe(expectedTag);
				}
			},
		);

		it("combines docker image config with database config", async () => {
			const config: PluginConfig = {
				dockerContainer: {
					image: "postgis/postgis",
					tag: "17-alpine",
				},
				database: "geodb",
				user: "geouser",
				password: "geopass",
				port: 5433,
			};

			const result = await configProvider(config);

			expect(result.config).toEqual({
				database: "geodb",
				user: "geouser",
				password: "geopass",
				port: 5433,
				host: "localhost",
			});

			if (result.dockerContainer !== false) {
				expect(result.dockerContainer).toEqual({
					image: "postgis/postgis",
					tag: "17-alpine",
					healthcheck: {
						test: ["pg_isready", "-U", "geouser"],
						interval: "5s",
						timeout: "5s",
						retries: 5,
					},
					ports: [
						{
							hostPort: 5433,
							containerPort: DEFAULT_POSTGRES_PORT,
						},
					],
					environment: {
						POSTGRES_DB: "geodb",
						POSTGRES_USER: "geouser",
						POSTGRES_PASSWORD: "geopass",
					},
				});
			}
		});
	});

	describe("edge cases", () => {
		it("handles empty config object with dockerContainer true", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
			};

			const result = await configProvider(config);

			expect(result.config.host).toBe("localhost");
			expect(result.config.port).toBe(DEFAULT_POSTGRES_PORT);
			expect(result.config.database).toBe(DEFAULT_POSTGRES_DB);
			expect(result.config.user).toBe(DEFAULT_POSTGRES_USER);
			expect(result.config.password).toBe(DEFAULT_POSTGRES_PASSWORD);
		});

		it("handles password function returning empty string", async () => {
			const config: PluginConfig = {
				dockerContainer: true,
				password: async () => "",
			};

			const result = await configProvider(config);

			expect(result.config.password).toBe(DEFAULT_POSTGRES_PASSWORD);
			if (result.dockerContainer !== false) {
				expect(result.dockerContainer.environment?.POSTGRES_PASSWORD).toBe(
					DEFAULT_POSTGRES_PASSWORD,
				);
			}
		});
		it("preserves additional config properties", async () => {
			type ExtendedConfig = PluginConfig & {
				max?: number;
				idle_timeout?: number;
			};
			const config: ExtendedConfig = {
				dockerContainer: true,
				max: 10,
				idle_timeout: 30,
			};

			const result = await configProvider(config);

			expect(result.config).toMatchObject({
				max: 10,
				idle_timeout: 30,
			});
		});
	});
});
