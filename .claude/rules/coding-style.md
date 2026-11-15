---
paths:
  - "**/*.ts"
  - "**/*.js"
---

# Coding Style & TypeScript

## Core principles

- KISS: ship the simplest solution that works, clarity over cleverness.
- DRY: extract on real repetition, not speculation.
- YAGNI: don't build features before they're needed.
- Name types and functions after the concepts users of the library know (plugin, fixture, seed, migration, dialect, container).
- Functional: if a caller can observe a call's effects anywhere but its return value, remove the side effect or return the change.
- Composition over inheritance: compose small functions and types, no class hierarchies.
- Least knowledge: a unit a caller cannot use from its signature alone, or that knows its callers, leaks a detail.
- Single responsibility: a part of a function carrying its own state, logic, or validation moves to its own file.
- Immutability: create new objects, never mutate existing ones.

## File organization

- Many small files over few large ones: 200-400 lines typical, 800 max.
- Organize by feature, not by type.
- When an edit would push a file past ~400 lines, extract a module instead of appending.
- Never create a barrel `index.ts`/`index.js` that only re-exports siblings; import from the file that defines the symbol.
- Generic, dialect-agnostic logic lives in `@kysely-vitest/core`; a dialect package (`postgres`) only holds what is specific to that database.

## Naming

- Variables, functions: camelCase.
- Booleans: `is`/`has`/`should`/`can` prefix.
- Types: PascalCase.
- Constants: UPPER_SNAKE_CASE.
- Files: kebab-case.

## Types

- Always `type`, never `interface`, except to augment a third-party declaration (e.g. vitest's `ProvidedContext`).
- Never a TypeScript `enum`: use a union of string literals or an `as const` object.
- Put explicit parameter and return types on exported functions, and let TypeScript infer obvious local types.
- Compose types with intersections (`&`), never class hierarchies.

## Avoid any

- Never `any` in library code.
- Use `unknown` for untrusted input, then narrow.
- Use generics when a value's type depends on the caller.

## Input validation

- Validate user-provided plugin config at the boundary and fail fast with an error naming the bad option.

## Error handling

- Never silently swallow an error.
- Use async/await with try-catch, narrowing `unknown` errors before accessing properties.
- Always release external resources (containers, connections) on failure paths.

## Code smells to avoid

- Deep nesting (>4 levels): use early returns.
- Magic numbers: use named constants.
- Long functions (>50 lines): split into focused pieces.
- Large files (>800 lines): extract modules.
- `console.log` in library code.
- Hidden side effects: return every change (a `Promise` if async).
- Code testable only through mocks: the logic is too coupled to its I/O.

## Comments

A comment ships only from the `cleanup-comments` keep table.

- A changeset adds zero comments.
- The four that ship: a contract the code cannot state, a `ponytail:` marker, a temporary TODO or out-of-scope note, a tool directive.
- A TODO ships only as temporary, naming the work that deletes it, never as documentation nobody will remove.
- Everything else goes, a non-obvious why, a library quirk, a workaround's cause and a warning against a future mistake included.
- One or two lines, for a human, never narration, never the what or the how.
- Prefer a clear name or a smaller function to a comment explaining an unclear one.
- Never restate the code, describe past implementations, leave commented-out code, add section banners, or JSDoc a self-evident signature.
- Doubt deletes, "might help someone later" being no standing and "someone will break this" being a test to write.

```
// Wrong
// loop over the migrations and run them
for (const migration of migrations) await migration.up(db);

// Correct
// the seed runs once per suite, outside the per-test transaction
await seed(db);
```
