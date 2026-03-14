# JSONSurgeon

A client-side JSON analysis tool powered by WebAssembly. Runs entirely in the browser — no server, no uploads.

**[Live Demo](https://cwmat.github.io/json-surgeon/)**

## Features

- Parse and explore large JSON files with a virtual-scrolling tree view
- Run [jq](https://jqlang.github.io/jq/) queries via WebAssembly (powered by [jq-web](https://github.com/nicowillis/jq-web))
- Schema inference, type breakdowns, key frequency analysis, and depth stats
- Drag-and-drop or paste JSON input
- Fully offline — all processing happens in your browser

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) with [vite-plugin-wasm](https://github.com/Menci/vite-plugin-wasm)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [TanStack Virtual](https://tanstack.com/virtual) for virtualized rendering
- Web Workers for off-main-thread parsing and jq execution

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This project deploys automatically to GitHub Pages via GitHub Actions on every push to `main`. The workflow is defined in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

> **Note:** The app uses WebAssembly and `SharedArrayBuffer`, which require [cross-origin isolation](https://developer.chrome.com/blog/enabling-shared-array-buffer/). A `coi-serviceworker` is injected to handle this on GitHub Pages, which doesn't support custom response headers.

To enable GitHub Pages manually:
1. Go to your repository **Settings → Pages**
2. Set **Source** to **GitHub Actions**

## License

MIT
