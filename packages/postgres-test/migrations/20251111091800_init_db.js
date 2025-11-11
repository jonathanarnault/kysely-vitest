/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function up(db) {
	await db.schema
		.createTable("users")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("username", "text", (col) => col.notNull())
		.execute();

	await db.schema
		.createTable("posts")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("authorId", "integer", (col) =>
			col.notNull().references("users.id"),
		)
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("content", "text", (col) => col.notNull())
		.execute();
}

/**
 * @param {import('kysely').Kysely<any>} db
 */
export async function down(db) {
	await db.schema.dropTable("posts").execute();
	await db.schema.dropTable("users").execute();
}
