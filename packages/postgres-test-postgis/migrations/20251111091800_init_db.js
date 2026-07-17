import { sql } from "kysely";

/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function up(db) {
	// Fails unless the postgis image finished its (socket-only) init phase and
	// is accepting TCP connections against a database that has the extension.
	await sql`CREATE EXTENSION IF NOT EXISTS postgis`.execute(db);

	await db.schema
		.createTable("places")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("location", sql`geometry(Point, 4326)`)
		.execute();
}

/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function down(db) {
	await db.schema.dropTable("places").execute();
}
