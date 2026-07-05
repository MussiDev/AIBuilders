# Conventional Commits Skill

Trigger: commit writing, commit messages, commitizen, conventional commits.

## Rules

- Use `type: description` format with types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
- Use `type(scope): description` when the change is scoped.
- Description in imperative, lowercase, no period.
- Body (if needed) separated by blank line, wrapped at 72 chars.
- Footer for breaking changes: `BREAKING CHANGE: description`.
- If Spanish project, keep commit messages in English.

## Examples

```
feat: add balance calculation for group members
fix(auth): prevent double session creation
docs: update API endpoints in README
refactor: extract decimal arithmetic to shared util
test: add coverage for settlement netting
```
