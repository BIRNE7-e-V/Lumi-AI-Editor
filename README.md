# Lumi AI Editor

An AI-powered worksheet editor that lets teachers create, edit, and export interactive learning materials. Content is built through a chat interface or manually, then exported as a PDF or as an H5P package compatible with [Lumi](https://lumi.education/).

## Features

- **AI-assisted content creation** — Chat with an OpenAI-compatible API to generate worksheet content (text blocks, multiple-choice questions, fill-in-the-blanks, freetext tasks)
- **Drag-and-drop editor** — Reorder, duplicate, edit, and delete content blocks
- **PDF export** — Render the worksheet as a print-ready PDF via `@react-pdf/renderer`
- **H5P export** — Package the worksheet into a `.h5p` file for use in Lumi / Moodle / LMS platforms
- **Speech input** — Dictate chat messages using the Web Speech API
- **Token deep-link** — Link users directly with a pre-filled API token via `?token=<value>` query parameter
- **Dark / light mode** — Persisted theme toggle
- **Keyboard shortcuts** — Configurable keybindings

## Tech Stack

| Layer         | Library                      |
| ------------- | ---------------------------- |
| Framework     | React 19 + TypeScript        |
| Routing       | TanStack Router (file-based) |
| Styling       | Tailwind CSS v4 + daisyUI v5 |
| Build         | Vite 8                       |
| PDF           | @react-pdf/renderer          |
| H5P packaging | fflate (ZIP)                 |
| Speech        | react-speech-recognition     |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

A mock OpenAI plugin is included for local development — API calls are intercepted and return dummy responses so no real API key is needed during development.

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Configuration

All settings are persisted in `localStorage`. They can be changed via the settings modal in the app.

| Key                      | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `api_token`              | OpenAI API key                                                              |
| `api_endpoint`           | API endpoint URL (defaults to `https://api.openai.com/v1/chat/completions`) |
| `api_model`              | Model ID (e.g. `gpt-5.4`)                                                   |
| `api_provider`           | Provider type (`openai`)                                                    |
| `transcription_language` | Language code for speech recognition (default `de`)                         |

### Token deep-link

Users can be pre-authenticated by linking them to:

```
https://your-domain.com/some-path?token=<api-token>
```

The token is automatically saved to `localStorage` and the user is redirected to the same path without the query parameter.

## Project Structure

```
src/
  components/       # UI components (editor, chat, settings, layout …)
  lib/              # App-wide constants and config
  routes/           # File-based TanStack Router routes
  state/            # Global state (React context + reducers)
  utils/            # H5P generator, API error helpers
```

## Available Models

| Model        | Input (per 1M tokens) | Output (per 1M tokens) |
| ------------ | --------------------- | ---------------------- |
| GPT-5.5      | $5.00                 | $30.00                 |
| GPT-5.4      | $2.50                 | $15.00                 |
| GPT-5.4 mini | $0.75                 | $4.50                  |

Token usage and estimated cost are tracked per model in `localStorage` and visible in the settings modal.

## Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start dev server on port 3000         |
| `npm run build`   | Production build                      |
| `npm run preview` | Preview production build              |
| `npm run test`    | Run tests with Vitest                 |
| `npm run update`  | Update dependencies (excludes ESLint) |
