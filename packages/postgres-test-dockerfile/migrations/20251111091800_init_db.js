/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function up(db) {
	await db.schema
		.createTable("users")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("username", "text", (col) => col.notNull())
		.execute();
}

/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function down(db) {
	await db.schema.dropTable("users").execute();
}
