# Domain docs

## Layout

Multi-context. The repo root contains a `CONTEXT-MAP.md` that points to per-project context files.

## Consumer rules

- Read `CONTEXT-MAP.md` at the repo root first
- Follow the map to the relevant `CONTEXT.md` for the sub-project being worked on
- Read that sub-project's `docs/adr/` for architectural decisions specific to that context

## Contexts

| Context | Path |
|---------|------|
| Frontend | `algomind-frontend/CONTEXT.md` |
| Backend | `algomind-backend/CONTEXT.md` |
| Extension | `algomind-extension/CONTEXT.md` |

Each context directory should also contain its own `docs/adr/` folder.
