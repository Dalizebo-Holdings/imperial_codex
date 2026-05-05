# Project Structure

The project is in early setup. Only the root scaffold exists.

## Current Layout

```
imperial_codex/
├── .gitignore
├── README.md
└── .kiro/
    └── steering/       # AI assistant guidance documents
```

## Expected Directories (based on .gitignore)

| Path | Purpose |
|------|---------|
| `src/` or `app/` | Application source code |
| `dist/` / `build/` / `out/` | Compiled output (gitignored) |
| `node_modules/` | Dependencies (gitignored) |

## Conventions

- Update this file as the project structure evolves
- Keep source code under a single top-level `src/` or `app/` directory
- Avoid committing build artifacts or generated files
