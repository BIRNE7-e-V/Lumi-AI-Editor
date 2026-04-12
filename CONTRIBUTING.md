# Contributing to Lumi AI Editor

Hi! Thank you for your interest in contributing to Lumi AI Editor. We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and feedback on open issues.

This document covers everything you need to get started. If something is unclear or missing, please open an issue and let us know.

---

## Table of Contents

- [Reporting Bugs and Requesting Features](#reporting-bugs-and-requesting-features)
- [Setting Up Locally](#setting-up-locally)
- [Development Workflow](#development-workflow)
- [Pull Requests](#pull-requests)
  - [Before You Open a PR](#before-you-open-a-pr)
  - [Coding Standards](#coding-standards)
  - [Redux Conventions](#redux-conventions)
  - [Lifecycle of a Pull Request](#lifecycle-of-a-pull-request)
- [License](#license)

---

## Reporting Bugs and Requesting Features

Before opening a new issue, please search existing issues to see if it has already been reported. If you find a relevant open issue, add a comment rather than opening a duplicate.

**Reporting a bug:** Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include:

- A clear description of what you expected to happen and what actually happened
- Steps to reproduce the issue reliably
- Your browser, operating system, and Node.js version
- Any relevant error messages from the browser console or terminal

**Requesting a feature:** Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml). Include the problem you're trying to solve — not just the proposed solution. A clearly described problem is valuable even if we end up solving it differently.

**Asking questions:** Open a regular issue with the `question` label. You're also welcome to start a discussion in the GitHub Discussions tab if you want a more open-ended conversation.

---

## Setting Up Locally

See the [Getting Started](README.md#getting-started) section of the README for the full setup steps. The short version:

```bash
git clone https://github.com/lumieducation/lumi-ai-editor.git
cd lumi-ai-editor
yarn install
yarn dev
```

The dev server runs at [http://localhost:3039](http://localhost:3039).

You'll need Node.js >= 20 and Yarn 1.22+. If `yarn dev` fails, try `yarn re:dev` which clears caches and reinstalls before starting.

---

## Development Workflow

### Branch naming

Branch names should be short and descriptive. Use a `feature/`, `fix/`, or `chore/` prefix:

```
feature/add-drag-drop-between-sections
fix/mcq-parser-empty-options
chore/upgrade-mui-7.1
```

### Keeping your branch up to date

Before opening a PR, rebase onto the latest `master`:

```bash
git fetch origin
git rebase origin/master
```

Resolve any conflicts before pushing. If you're unsure how to handle a conflict, ask in the PR and someone will help.

### Running checks locally

Run the full suite of checks before pushing:

```bash
yarn build          # TypeScript + production build
yarn lint           # ESLint
yarn fm:check       # Prettier
```

Or fix everything automatically:

```bash
yarn fix:all        # lint:fix + fm:fix
```

The Vite dev server also runs ESLint and TypeScript checks in an overlay — any errors will appear in the browser.

---

## Pull Requests

### Before You Open a PR

- Make sure the build passes: `yarn build`
- Make sure there are no lint or formatting errors: `yarn fix:all && yarn build`
- If you're fixing a bug, include a short description of the root cause in the PR body
- If you're adding a feature, include a brief explanation of the design decisions you made and any alternatives you considered
- Keep PRs focused. A PR that does one thing is easier to review than one that does five

If you're unsure whether a change is in scope, open an issue first to discuss it. A little upfront conversation can save a lot of review back-and-forth.

### Coding Standards

**TypeScript**

All code must pass TypeScript strict mode (`tsc --noEmit` as part of `yarn build`). Avoid `any` — if you need to escape the type system, use `unknown` and narrow it. Do not add `@ts-ignore` comments without an explanation.

**React components**

- Use function components with hooks. No class components.
- Keep components focused. If a component is getting large, split it: extract a child component or move logic into a custom hook.
- Do not compute derived state inside a component. Derive it in a selector.
- Use the `sx` prop for styling. Prefer `theme.vars.*` tokens over hardcoded values.

**Import order**

ESLint enforces the following import order (configured in `eslint.config.mjs`):

1. Side-effect imports (CSS, polyfills)
2. Type-only imports
3. External packages (MUI first)
4. Internal: hooks → utils → types → routes → sections → components
5. Relative parent/sibling imports

Run `yarn lint:fix` to auto-sort imports.

**File naming**

- React components: `kebab-case.tsx` (e.g. `content-item.tsx`)
- Hooks: `use-kebab-case.ts` (e.g. `use-drag-drop.ts`)
- Slices, selectors, types: `camelCaseSlice.ts`, `camelCaseSelectors.ts`, `camelCaseTypes.ts`

**Comments**

Do not add comments to explain what code does — write clear code instead. Comments are appropriate when explaining _why_ a non-obvious decision was made.

### Redux Conventions

This project has strict Redux conventions. Here is a summary:

**Actions describe events, not operations**

Action names describe what _happened_ in the domain, not what the reducer will do with the data.

```typescript
// Good
worksheetContentAdded;
chatMessageAdded;
apiTokenChanged;

// Avoid
setContent;
updateMessages;
setToken;
```

**Business logic lives in reducers**

If code implements a domain rule — validation, state machine transitions, conflict resolution, permission checks — it belongs in the reducer, not in a thunk or action creator.

**Selectors own derived data**

If a component needs to display a computed or filtered view of the state, that computation belongs in a selector (use `createSelector` for memoisation when the computation is non-trivial). Components should call selectors and render — nothing more.

**Thunks handle I/O only**

Thunks are for making API calls, dispatching `pending`/`fulfilled`/`rejected` lifecycle actions, and reading current state to build a request body. They must not contain domain rules or state transition logic.

**Folder structure**

```
src/state/
  <slice-name>/
    <slice-name>Slice.ts       # Reducer + action creators
    <slice-name>Selectors.ts   # All selectors for this slice
    <slice-name>Types.ts       # TypeScript types (if non-trivial)
    <slice-name>Thunks.ts      # Async thunks
    <slice-name>Actions.ts     # Plain action creator helpers (if needed)
```

### Lifecycle of a Pull Request

1. **Open the PR** against `master`. If the work is in progress, open it as a Draft PR so reviewers know it's not ready yet. Draft PRs are a great way to get early feedback before polishing.

2. **Fill in the PR description.** Explain what the change does and why. Link any related issues with `Closes #123` or `Refs #123`.

3. **CI checks run automatically.** Address any failures before asking for review. If a check is failing for reasons unrelated to your change, note it in the PR description.

4. **Code review.** At least one maintainer must approve before merging. Reviewers may ask for changes — this is normal and not a judgement of your work. Engage with comments, ask clarifying questions if needed, and push follow-up commits to the same branch.

5. **Approvals and merge.** Once approved and checks are green, a maintainer will merge the PR. We generally use squash merges to keep the `master` history clean.

**A few things that speed up reviews:**

- Keep the diff small. Split large changes into a series of smaller PRs where possible.
- Add context to non-obvious code in comments or the PR description rather than leaving reviewers to guess.
- Respond to review comments promptly — PRs that go quiet for a long time tend to fall behind `master` and become harder to merge.

**We're here to help.** If you're stuck at any point — whether it's the setup, a failing check, or how to approach a problem — leave a comment in the PR or issue and we'll help you figure it out. No contribution is too small and no question is too basic.

---

## License

By contributing to Lumi AI Editor, you agree that your contributions will be licensed under the [MIT License](LICENSE.md) that covers the project. Please make sure you have the right to contribute any code you submit — do not include code copied from projects with incompatible licences.
