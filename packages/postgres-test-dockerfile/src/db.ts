import type { Generated, Selectable } from "kysely";

export type DB = {
	users: UserTable;
};

export type UserTable = {
	id: Generated<number>;
	username: string;
};

export type User = Selectable<UserTable>;
