import type { Generated, Selectable } from "kysely";

export type DB = {
	places: PlaceTable;
};

export type PlaceTable = {
	id: Generated<number>;
	name: string;
};

export type Place = Selectable<PlaceTable>;
