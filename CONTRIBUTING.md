# Contributing

Run `npm install`, `npm test`, and `npm run build`. Keep scripture identity,
reading records, derived statistics, persistence, and visualization separate.
Add domain tests for parser changes and import/export changes. Check whole-Bible
and focused views, keyboard navigation, mobile layouts, and offline operation.
Never introduce reading telemetry, scores, streaks, or cloud transmission as a
prerequisite for local use. New canon data needs its own versification identity.

Browser regression tests run against a fresh production build on port 4173:

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npm run test:e2e -- --project=chromium
npm run test:e2e:ui
npx playwright show-report
```

Each test gets a fresh browser context with isolated IndexedDB, localStorage,
cookies and service-worker caches. Multiple tabs in a concurrency test share
only that test's context. Dates are controlled with Playwright's fixed clock;
timers still run normally. Wait for visible state or service-worker readiness,
never arbitrary sleeps. Migration seeds a real v1 IndexedDB before the app loads.
Failure traces and screenshots appear in `test-results/`, with an HTML report
in `playwright-report/`; CI uploads both even when tests fail.

CI runs on pull requests and manual dispatches, not pushes. Pull-request runs
test the PR merge commit. CI cancels older runs for the same source repository
and branch.
Unit tests and the production build run once. Four parallel browser jobs reuse
that build: desktop/mobile Chromium, Firefox, desktop WebKit, and mobile WebKit.
Each installs only its required browser; Chromium installs the headless shell.
Browser binaries are cached by OS, architecture, Linux distribution version,
browser engine, and the installed Playwright version. Exact cache hits skip
browser downloads; system dependencies are installed on every fresh runner.
Desktop and mobile WebKit share a cache key. Manual runs on `main` populate
caches that other branches and PRs can restore; caches created on a feature
branch or PR are subject to GitHub's branch scope restrictions. Unrelated npm
dependency changes do not invalidate the browser cache.
Every existing test/project combination still runs, with the same isolation,
assertions and retries. Reports are uploaded separately for each browser job.
The final `test` check requires both the build and all browser jobs to succeed.
`PLAYWRIGHT_SKIP_BUILD=1` lets CI serve the downloaded production build; local
commands continue building from source by default.

The supported test matrix is Playwright's bundled desktop Chromium, Firefox,
and WebKit, plus Pixel 7 Chromium and iPhone 13 WebKit viewport/touch emulation.
All core workflows and concurrent-tab tests run in every project. Touch tests
run only in mobile projects. Firefox offline emulation is not supported by
Playwright, so its offline case is explicitly skipped. WebKit's context offline
reload reports an internal navigation error in Playwright and is also skipped;
offline production reload and storage are covered in desktop and mobile Chromium.
Firefox could not launch on the current macOS development host ("Could not find
profile folder"); its project stays enabled in Linux CI and must pass there.
Emulation is not physical-device
or installed Safari/Chrome certification. Canvas tests assert pixel differences,
geometry and hit testing rather than OS-dependent full-page screenshot baselines.
The suite covers current behavior; add browser regressions with new workflows.

Formatting uses Prettier with two-space indentation and its other defaults.
Run `npm run format` to format the project, or `npm run format:check` to check it.
`npm install` enables the Husky pre-commit hook, which runs Prettier on staged
files via lint-staged and stages the formatting changes automatically. Unsupported
file types are skipped, and unstaged edits in partially staged files are preserved.
