# Contributing

Run `npm install`, `npm test`, and `npm run build`. Keep scripture identity,
reading records, derived statistics, persistence, and visualization separate.
Add domain tests for parser changes and import/export changes. Check whole-Bible
and focused views, keyboard navigation, mobile layouts, and offline operation.
Never introduce reading telemetry, scores, streaks, or cloud transmission as a
prerequisite for local use. New canon data needs its own versification identity.

Formatting uses Prettier with two-space indentation and its other defaults.
Run `npm run format` to format the project, or `npm run format:check` to check it.
`npm install` enables the Husky pre-commit hook, which runs Prettier on staged
files via lint-staged and stages the formatting changes automatically. Unsupported
file types are skipped, and unstaged edits in partially staged files are preserved.
