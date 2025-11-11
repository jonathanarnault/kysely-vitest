import type { Dialect } from "kysely";
import type { ProvidedContext } from "vitest";

export type DialectFactory<K extends keyof ProvidedContext> = (
	config: ProvidedContext[K],
) => Dialect;
