# AGENTS.md

## Project Context

**Color Space** is a VS Code extension that automatically assigns a unique color to each workspace window to help distinguish between them. It supports auto-coloring based on workspace names, manual color selection, and a creative mode picker.

- **Stack**: TypeScript, VS Code Extension API, Node.js

## Key Files & Structure

- `src/ColorManager.ts`: Core logic for color generation, management, and application.
- `src/extension.ts`: Entry point. Registers commands (`colorspace.*`) and activates the extension.
- `src/getPreviewHtml.ts` / `src/getCreativeHtml.ts`: Webview HTML generators for UI.
- `scripts/`: Build and maintenance scripts (package, release, icon generation).

## Development Workflow

### Commands
- **Build**: `npm run compile` (TypeScript compilation)
- **Package**: `npm run package` (Create .vsix)
- **Local Install**: `npm run local` (Install .vsix locally)
- **Lint**: `npm run lint`
- **Release**: `npm run release` (Automated release process)

### Conventions
- **TypeScript**: Strict mode enabled.
- **Async**: Prefer `async/await`.
- **Commits**: Follow "micro-commit" strategy.
- **Changes**: Update `CHANGELOG.md` when adding features.

## Configuration
The extension uses `colorspace` configuration section:
- `colorspace.enabled`: Toggle auto-coloring.
- `colorspace.ignoreList`: Workspaces to exclude.
