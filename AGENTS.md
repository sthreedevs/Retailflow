<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Codebase Rules

## Language & File Conventions
- **Vanilla JavaScript & JSX ONLY**: All components must use `.jsx` and all logic/service/db/model files must use `.js` (or `.mjs`).
- **No TypeScript**: Do not write `.ts` or `.tsx` files. Avoid TypeScript type annotations and interfaces.
- **Import Aliases**: Use `@/*` pointing to `./src/*` configured via `jsconfig.json`.
- **UI Components**: Components must be vanilla React JSX.

## Test & Scratch File Cleanup
- **Delete After Use**: All test files (`.mjs`, `.js`), verification scripts, or scratch files used during testing must be deleted immediately after their use.
- **No Lingering Test Artifacts**: Do not leave one-off scratch scripts or test files in the codebase.

