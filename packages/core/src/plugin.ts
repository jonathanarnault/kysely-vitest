import { default as fs } from "node:fs/promises";
import { default as path } from "node:path";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import type { ProvidedContext } from "vitest";
import type { Vite } from "vitest/node";
import type { DialectFactory } from "./types.js";

export function createPlugin<K extends keyof ProvidedContext>({
	name,
	configKey,
	dialectFactory,
}: PluginConfig<K>) {
	return function plugin({
		config,
		migrationFolder,
	}: PluginParams<K>): Vite.Plugin {
		return {
			name: `kysely-vitest-${name}`,
			async configureVitest(context) {
				if (migrationFolder) {
					const db = new Kysely({
						dialect: dialectFactory(config[configKey]),
					});
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
					} finally {
						await db.destroy();
					}
				}

				context.vitest.provide(configKey, config);
			},
		};
	};
}

export type PluginConfig<K extends keyof ProvidedContext> = {
	name: string;
	configKey: K;
	dialectFactory: DialectFactory<K>;
};

export type PluginParams<K extends keyof ProvidedContext> = {
	config: ProvidedContext[K];
	migrationFolder?: string;
};
