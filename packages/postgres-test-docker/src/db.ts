import type { Generated, Selectable } from "kysely";

export type DB = {
	users: UserTable;
	posts: PostTable;
};

export type UserTable = {
	id: Generated<number>;
	username: string;
};

export type User = Selectable<UserTable>;

export type PostTable = {
	id: Generated<number>;
	authorId: number;
	title: string;
	content: string;
};

export type Post = Selectable<PostTable>;
