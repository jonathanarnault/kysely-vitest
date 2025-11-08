import type { DB } from "./db.ts";

declare module "vitest" {
	export interface TestDB extends DB {}
}
