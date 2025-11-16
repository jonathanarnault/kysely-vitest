import { default as fs } from "node:fs/promises";
import { default as path } from "node:path";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import type { ProvidedContext } from "vitest";
import type { Vite } from "vitest/node";
import {
	type DockerContainer,
	startDockerContainer,
	stopDockerContainer,
} from "./docker.js";
import type { DialectFactory, SeedFunction } from "./types.js";

export function createPlugin<K extends keyof ProvidedContext, C>({
	name,
	configKey,
	configProvider,
	dialectFactory,
}: PluginConfig<K, C>) {
	return function plugin<DB>({
		config,
		migrationFolder,
		seed,
	}: PluginParams<C, DB>): Vite.Plugin {
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

							await migrator.migrateToLatest();
						} catch (e) {
							context.vitest.logger.error(
								`[${name}] Error during migrations: ${e}`,
							);
							throw e;
						}
					}

					await seed?.(db);

					context.vitest.provide(configKey, checkedConfig);
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

export type PluginConfig<K extends keyof ProvidedContext, C> = {
	name: string;
	configKey: K;
	configProvider: ConfigProvider<K, C>;
	dialectFactory: DialectFactory<K>;
};

export type PluginParams<C, DB> = {
	config: C;
	migrationFolder?: string;
	seed?: SeedFunction<DB>;
};

export type ConfigProvider<K extends keyof ProvidedContext, C> = (
	config: C,
) => Promise<Config<K>> | Config<K>;

export type Config<K extends keyof ProvidedContext> = {
	config: ProvidedContext[K];
	dockerContainer: DockerContainer | false;
};
