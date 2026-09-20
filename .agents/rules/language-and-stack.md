# Language & Stack Rule

## JavaScript & JSX Only
- **Language**: Use Vanilla JavaScript (`.js`) and JSX (`.jsx`) for all components, routes, models, services, and utilities.
- **Strictly No TypeScript**: Do NOT use TypeScript (`.ts` or `.tsx`). Do not introduce TypeScript types, interfaces, or type annotations.
- **Component File Extension**: All React components must use `.jsx`.
- **Backend / Utility File Extension**: All server modules, database models, services, scripts, and libraries must use `.js` or `.mjs`.
- **Component Generator Configuration**: Keep `components.json` configured with `"tsx": false` so all generated UI components are pure JavaScript/JSX.
- **Aliases**: Import aliases configured via `jsconfig.json` with `"@/*": ["./src/*"]`.
