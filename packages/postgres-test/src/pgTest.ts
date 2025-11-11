import { createPostgresTestFunction } from "@kysely-vitest/postgres/test.js";
import type { DB } from "./db.js";

export const pgTest = createPostgresTestFunction<DB>();
