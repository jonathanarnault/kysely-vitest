# Agent Coding Practices

This document provides an overview of coding practices and patterns for AI agents working on this monorepo.

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`

## MCP

Use `context7` MCP server if available to browse package documentation

## Code style
- TypeScript strict mode
- Double quotes, use semicolons
- Use functional patterns where possible
- Put helper functions after the component or function that uses them
- Put component props after the component
- Put hook params after the hook
- Only add comments when the code is hard to follow
- Refactor code when a file gets too large:
    - Use functions when possible to avoid code taht is too large
- DO NOT create `index.ts` files that export all files in a directory

## General Practices

- Use `react` for frontend
- Use `vitest`, `@vitest/browser` and `vitest-browser-react` for unit tests

## Architecture

- Libraries are located in the `packages` folder
- Services are located in the `services` folder

## Testing

To run tests for a specific package, run the following command:

```bash
pnpm turbo run test --filter=@kysely-vitest/{packageName}
```

Example:
```bash
pnpm turbo run test --filter=@kysely-vitest/composer
```

**General Principles**
- **Explicitness over implicit behavior**: Make test setup and dependencies visible
- **Reduce duplication**: Use parameterized tests when patterns emerge
- **Clean assertions**: Use appropriate tools instead of manual traversal
- **Test isolation**: Each test should be independent and not share mutable state
- **Name you test files *.spec.ts(x)**

**Testing React Components**
- Use `@vitest/browser` and `vitest-browser-react` for testing React components. 
- `@vitest/browser` and `vitest-browser-react` are added at the root of the repository, DO NOT add them to inner packages
- DO USE `expect.element` when testing HTML elements

**Testing zod schemas**
- Test that validation fails with partial schemas
- Always use `it.each` for failure cases

**Use parameterized tests with `it.each`**
- Merge similar test cases using `it.each` to reduce duplication
- Use descriptive parameter names in test titles with `$parameter` syntax
- Group related test scenarios together

   ```typescript
   // ✅ Prefer
   it.each([
     { key: "Backspace", expectedContent: [...] },
     { key: "Enter", expectedContent: [...] },
   ])(
     "does not remove section when $key is pressed",
     async ({ key, expectedContent }) => {
       // test implementation
     }
   );
   ```

**Avoid `beforeEach` for initialization**
- Promotes better test isolation and explicitness
- Each test is self-contained and independent

   ```typescript
   // ❌ Avoid
   describe("tests", () => {
     let editor: Editor;
     beforeEach(() => {
       editor = new Editor({ ... });
     });
   });

   // ✅ Prefer
   describe("tests", () => {
     it("test case", () => {
       const editor = new Editor({ ... });
     });
   });
   ```
