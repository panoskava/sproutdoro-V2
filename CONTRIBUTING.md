# Contributing to Sproutdoro

Thank you for your interest in contributing!

## Branch strategy

| Rule | Detail |
|------|--------|
| **Default branch** | `main` — always deployable |
| **Branch naming** | `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>` |
| **Commits** | [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `chore:`, `test:` |
| **Merging** | Squash merge via PR only; delete branch after merge |
| **Releases** | Tag `v2.5.0` on `main` after launch milestones; GitHub Release with changelog |

## Development workflow

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run lint && npm run test && npm run build`
4. Open a pull request against `main`

## Pull request checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Type-check passes (`npm run lint`)
- [ ] Changes are focused and scoped to one concern

## GitHub Pages setup (maintainers)

After merging to `main`:

1. **Settings → Pages → Source:** GitHub Actions
2. **Settings → Branches → Protect `main`:** require PR, require status check `build-and-test`, no force push

## Reporting issues

Use the GitHub issue templates for bugs and feature requests.
