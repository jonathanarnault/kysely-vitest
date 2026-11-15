import { default as fs } from "node:fs/promises";
import { default as path } from "node:path";
import { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import type { ProvidedContext } from "vitest";
import type { Vite } from "vitest/node";
import {
	type DockerContainer,
	startDockerContainer,
	stopDockerContainer,
} from "./docker.js";
import type { DialectFactory, ResetFunction, SeedFunction } from "./types.js";

export function createPlugin<K extends keyof ProvidedContext, C, R = never>({
	name,
	configKey,
	configProvider,
	dialectFactory,
	resetDatabase,
}: PluginConfig<K, C, R>) {
	return function plugin<DB>({
		config,
		migrationFolder,
		seed,
		reset,
	}: PluginParams<C, DB, R>): Vite.Plugin {
		return {
			name: `kysely-vitest-${name}`,
			async configureVitest(context) {
				let containerName: string | null = null;

				const { dockerContainer, config: checkedConfig } =
					await configProvider(config);

				if (dockerContainer) {
					containerName = await startDockerContainer(dockerContainer);

					context.vitest.onClose(async () => {
						containerName && (await stopDockerContainer(containerName));
					});
				}

				const db = new Kysely<DB>({
					dialect: dialectFactory(checkedConfig),
				});

				try {
					if (reset) {
						if (!resetDatabase) {
							throw new Error(
								`[${name}] The "reset" option is not supported by this plugin`,
							);
						}
						await resetDatabase(db, reset);
					}

					if (migrationFolder) {
						try {
							const migrator = new Migrator({
								db,
								provider: new FileMigrationProvider({
									fs,
									path,
									migrationFolder,
								}),
							});

							const { error, results } = await migrator.migrateToLatest();
							if (error) {
								context.vitest.logger.error(
									`[${name}] Migration failed: ${error}` +
										(results?.length ? ` (applied ${results.length})` : ""),
								);
								throw error;
							}
						} catch (e) {
							context.vitest.logger.error(
								`[${name}] Error during migrations: ${e}`,
							);
							throw e;
						}
					}

					await seed?.(db);

					context.project.provide(configKey, checkedConfig);
				} catch (e) {
					context.vitest.logger.error(`[${name}] Error during setup: ${e}`);
					await stopDockerContainer(containerName);
					throw e;
				} finally {
					await db.destroy();
				}
			},
		};
	};
}

export type PluginConfig<K extends keyof ProvidedContext, C, R = never> = {
	name: string;
	configKey: K;
	configProvider: ConfigProvider<K, C>;
	dialectFactory: DialectFactory<K>;
	resetDatabase?: ResetFunction<R>;
};

export type PluginParams<C, DB, R = never> = {
	config: C;
	migrationFolder?: string;
	seed?: SeedFunction<DB>;
	reset?: R | false;
};

export type ConfigProvider<K extends keyof ProvidedContext, C> = (
	config: C,
) => Promise<Config<K>> | Config<K>;

export type Config<K extends keyof ProvidedContext> = {
	config: ProvidedContext[K];
	dockerContainer: DockerContainer | false;
};
