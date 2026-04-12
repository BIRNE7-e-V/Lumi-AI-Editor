# Lumi AI Editor

An AI-powered educational worksheet editor built with React 19, Material-UI 7, and Redux Toolkit. Create, edit, and export interactive learning content with assistance from large language models.

---

## Features

- **AI-assisted content generation** — Generate text blocks and multiple-choice questions from a single prompt using any OpenAI-compatible API
- **Interactive worksheet editor** — Drag-and-drop content blocks: text, multiple-choice, fill-in-the-blanks, and freetext tasks
- **AI chat assistant** — A chat drawer that can read and rewrite the entire worksheet in context
- **H5P export** — Export finished worksheets as H5P packages for embedding in LMS platforms (Moodle, Canvas, etc.)
- **System prompt customisation** — Override the default AI persona for domain-specific workflows
- **Text-to-speech** — Read content aloud directly in the browser
- **Fully typed** — TypeScript strict mode throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 (strict mode) |
| Build tool | Vite 6 + SWC |
| UI library | Material-UI (MUI) 7 + Emotion |
| State management | Redux Toolkit 2 + React-Redux 9 |
| Routing | React Router 7 |
| HTTP | Axios |
| Linting | ESLint 9 (flat config) |
| Formatting | Prettier 3 |
| Icons | Iconify |
| Charts | ApexCharts |

---

## Prerequisites

- **Node.js** >= 20
- **Yarn** 1.22+ (`npm install -g yarn`)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/lumieducation/lumi-ai-editor.git
cd lumi-ai-editor
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Start the development server

```bash
yarn dev
```

The app runs at [http://localhost:3039](http://localhost:3039).

### 4. Configure an AI provider

Open the app and click the settings icon in the editor header. Enter:

- **API endpoint** — defaults to `https://api.openai.com/v1/chat/completions`
- **API token** — your OpenAI (or compatible) API key

These values are persisted to `localStorage` only — they are never sent anywhere other than the configured endpoint.

---

## Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start dev server on port 3039 |
| `yarn build` | TypeScript check + production build |
| `yarn start` | Preview production build |
| `yarn lint` | ESLint check |
| `yarn lint:fix` | ESLint auto-fix |
| `yarn fm:check` | Prettier check |
| `yarn fm:fix` | Prettier format |
| `yarn fix:all` | Run `lint:fix` and `fm:fix` together |
| `yarn tsc:watch` | Watch TypeScript compilation |
| `yarn tsc:dev` | Run dev server and TypeScript watcher concurrently |
| `yarn clean` | Remove `node_modules`, `dist`, build artifacts |
| `yarn re:dev` | Clean, reinstall, and start dev server |
| `yarn re:build` | Clean, reinstall, and build for production |
| `yarn h5p:build-base` | Rebuild the H5P base archive used for exports |

---

## Project Structure

```
lumi-ai-editor/
├── public/                  # Static assets
├── scripts/                 # Build-time scripts (H5P base creation)
├── src/
│   ├── app.tsx              # Root component (ThemeProvider, scroll restore)
│   ├── main.tsx             # Entry point (Redux Provider, Router)
│   ├── config-global.ts     # App name / version constants
│   ├── global.css           # Global styles
│   │
│   ├── components/          # Shared, reusable UI components
│   │   ├── chart/           # ApexCharts wrapper
│   │   ├── iconify/         # Iconify icon component
│   │   ├── label/           # Chip-style label
│   │   ├── logo/            # Logo component
│   │   └── scrollbar/       # SimpleBar custom scrollbar
│   │
│   ├── layouts/             # Page layout shells
│   │   ├── auth/            # Auth pages layout
│   │   ├── dashboard/       # Dashboard layout with sidebar/nav
│   │   └── core/            # Shared layout primitives
│   │
│   ├── pages/               # Route page components (thin wrappers)
│   │   ├── home.tsx
│   │   ├── dashboard.tsx
│   │   ├── sign-in.tsx
│   │   └── ...
│   │
│   ├── routes/              # Routing configuration
│   │   ├── sections.tsx     # Route definitions with lazy loading
│   │   └── hooks/           # usePathname, useRouter
│   │
│   ├── sections/            # Feature modules
│   │   ├── editor/          # Main worksheet editor (see below)
│   │   ├── auth/            # Sign-in forms and flows
│   │   ├── overview/        # Dashboard overview section
│   │   └── ...
│   │
│   ├── state/               # Redux store
│   │   ├── index.ts         # Store configuration + persistence middleware
│   │   ├── chat/            # AI chat slice (messages, H5P generation)
│   │   └── lumi-editor/     # Worksheet editor slice (content, API config)
│   │
│   ├── theme/               # MUI theme configuration
│   │   ├── theme-config.ts  # Default palette, typography, shadows
│   │   └── index.tsx        # ThemeProvider export
│   │
│   ├── utils/               # Pure utility functions
│   │   ├── format-number.ts
│   │   ├── format-time.ts
│   │   └── h5p-generator.ts # H5P package generation logic
│   │
│   └── _mock/               # Development mock data
│
├── .github/
│   └── ISSUE_TEMPLATE/      # Bug report and feature request templates
├── CLAUDE.md                # Guidance for AI-assisted development
├── CONTRIBUTING.md          # Contribution guidelines
├── eslint.config.mjs        # ESLint flat config
├── prettier.config.mjs      # Prettier config
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite build config
```

### Editor Section (`src/sections/editor/`)

The editor is the core feature of this application and has its own self-contained structure:

```
sections/editor/
├── index.tsx                # Top-level editor container
├── constants.ts             # Provider configs, defaults
├── types.ts                 # Editor-specific TypeScript types
│
├── components/
│   ├── editor-canvas.tsx    # Worksheet canvas, content list
│   ├── editor-header.tsx    # Title bar, export, settings
│   ├── ai-chat-drawer.tsx   # Right-side AI chat panel
│   ├── content-item.tsx     # Content block renderer
│   ├── text-content.tsx     # Editable text block
│   ├── mcq-content.tsx      # Multiple-choice question block
│   ├── command-menu.tsx     # Add-content command palette
│   ├── content-menu.tsx     # Per-block context menu
│   ├── ai-text-dialog.tsx   # AI text generation dialog
│   ├── ai-question-dialog.tsx  # AI question generation dialog
│   ├── system-prompt-dialog.tsx # Custom system prompt editor
│   ├── welcome-state.tsx    # Empty-state onboarding UI
│   └── content-skeleton.tsx # Loading placeholder
│
├── hooks/
│   ├── use-ai-generation.ts # Text/question generation via OpenAI
│   ├── use-ai-chat.ts       # Chat message send/receive
│   ├── use-content-management.ts # Add/edit/delete/move blocks
│   ├── use-api-config.ts    # Provider/endpoint/token management
│   ├── use-drag-drop.ts     # Drag-and-drop reordering
│   ├── use-menus.ts         # Menu open/close state
│   ├── use-focus-state.ts   # Keyboard focus management
│   └── use-speech.ts        # Text-to-speech
│
└── utils/
    ├── mcq-parser.ts        # Parse MCQ from AI response text
    └── worksheet-commands.ts # Execute structured AI worksheet commands
```

---

## Redux Architecture

State is split into two domain slices under `src/state/`.

### `lumiEditor` slice

Owns the worksheet content and the AI API configuration.

```typescript
{
  apiConfig: { provider, apiEndpoint, apiToken },
  title: string,
  content: Record<ID, Content>,   // normalised by ID
  structure: Array<ID>,           // ordered list of content IDs
  worksheetId: string | null,
  ui: { loading, saving, tokenLimitError }
}
```

Content types: `text`, `multiple-choice`, `fill-in-the-blanks`, `freetext`.

### `chat` slice

Owns the AI chat conversation and H5P export state.

```typescript
{
  messages: ChatMessage[],
  loading: boolean,
  h5pGenerating: boolean,
  h5pTitle: string | null,
  h5pContentJson: string | null,
  customSystemPrompt: string | null,
  readAloudEnabled: boolean
}
```

### Conventions

- **Actions describe events**, not setter operations: `WORKSPACE_CHANGED`, not `SET_WORKSPACE`.
- **All business logic lives in reducers.** Action creators are plain payload factories.
- **All derived data lives in selectors.** Components never compute derived state inline.
- **Thunks handle only I/O** — API calls and dispatching lifecycle actions. No domain rules.

See [CLAUDE.md](CLAUDE.md) for the full Redux coding standards.

---

## Content Types

| Type | Description |
|---|---|
| `text` | Rich paragraph text block |
| `multiple-choice` | Question with labelled answer options and a single correct answer |
| `fill-in-the-blanks` | Cloze text with blanks marked by `*asterisks*` |
| `freetext` | Open-ended task with a student response area |

---

## AI Integration

The editor connects to any OpenAI-compatible API. The default endpoint is `https://api.openai.com/v1/chat/completions`.

**How it works:**

1. The user configures an endpoint and API token in the settings panel (gear icon in the editor header).
2. For individual blocks, the editor sends a focused prompt and inserts the AI response directly.
3. The chat drawer sends the full worksheet state as context. The assistant may return a `[WORKSHEET_UPDATE: {...}]` block in its response; the thunk parses this and applies the changes to the editor state automatically.

Credentials are stored in `localStorage` under keys `api_provider`, `api_endpoint`, and `api_token`. They are never proxied through a backend server.

---

## H5P Export

Worksheets can be exported as `.h5p` packages for import into any H5P-compatible LMS (Moodle, Canvas, H5P.com). The export bundles all content blocks using the **H5P Column** content type.

To regenerate the base H5P archive (only needed when updating H5P library versions):

```bash
yarn h5p:build-base
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

Distributed under the [MIT](LICENSE.md) license.
