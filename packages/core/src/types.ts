import type { Dialect, Kysely } from "kysely";
import type { ProvidedContext } from "vitest";

export type DialectFactory<K extends keyof ProvidedContext> = (
	config: ProvidedContext[K],
) => Dialect;

export type SeedFunction<DB> = (db: Kysely<DB>) => Promise<void>;
