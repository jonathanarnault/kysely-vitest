---
paths:
  - "**/*.ts"
---

# Testing

## Test packages

- Unit specs (`*.spec.ts`) sit beside the source in `core` and `postgres`.
- `postgres-test-*` packages are integration suites exercising the plugin against a real database, one per setup (docker image, dockerfile, external server, postgis).
- A change to plugin behavior is covered in the integration package matching the setup it affects.
- Run a package with `pnpm turbo run test --filter=@kysely-vitest/<package>`.

## What to test

- Every behavior a library user or a cross-file caller depends on: untested behavior does not ship.
- The unit is the behavior, not the function, so a private helper is covered through its caller.
- Take cases from the documented contract (readme, issue, public types), never from reading the implementation, which freezes its bugs as rules.
- Assert behavior and outputs, never internals.
- Cover the happy path and the errors the contract says it must reject.

## How many tests

Coverage is a floor on the rules, not a licence to enumerate.

- One test per rule, not per input, branch, line, or function.
- One happy path, unless the contract states a different rule for the second.
- Only the failures the contract names.
- Cases differing only by input or output collapse into one `it.each`.
- One whole-value `toEqual` over several partial tests.
- Name the rule a test guards, in one line, before writing it; if you cannot, don't write it.
- A spec file much longer than its module is enumeration, not coverage.

Never test what the compiler proves (types, exhaustive switches, required options), third-party behavior (Kysely building SQL, vitest running fixtures), constants, or re-exports.

BOUNDARY finds candidates (boundary and out-of-range values, unexpected input, null, duplicates, alternative states, races, failure conditions), but keep only those the contract rules on; an edge case the contract is silent on is a question for the issue.

## How to write them

- Red, green, refactor.
- Arrange-Act-Assert, one behavior per test.
- Keep tests fast and repeatable whatever the date, network, or order.
- No shared mutable state, and no `beforeEach` for initialization: each test builds what it needs.
- A failure names its own reason.
- Name the test after the behavior: `it("should return an empty array when no items match")`, never `it("should work")`.
- Assert whole values with `toEqual` (`toMatchObject` for a subset), since asserting one field lets the rest regress.
- Use `it.each` for cases varying only by input, with `$parameter` titles and passing and failing cases in separate blocks.
- Only update a test to make it pass if the contract changed; otherwise it caught a regression, so fix the code.
- Pruning tests that duplicate existing coverage is a separate pass, see the `cleanup-tests` skill.
