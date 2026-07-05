---
name: conventional-commit
description: Se usa al crear un commit o cuando el usuario pide un mensaje de commit. Genera mensajes en formato Conventional Commits.
---

# Conventional Commit

## Formato

```
tipo(scope): descripción en imperativo, minúscula, sin punto final
```

## Tipos
- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `docs`: cambios en documentación
- `style`: formato, espacios, puntos y coma (no lógica)
- `refactor`: refactorización sin cambios funcionales ni fixes
- `perf`: mejora de rendimiento
- `test`: añadir o corregir tests
- `chore`: tareas de mantenimiento, builds, dependencias
- `ci`: cambios en CI/CD

## Reglas
- Descripción en **imperativo**: "add", "fix", "remove", no "added", "fixed", "removes".
- Todo en **minúscula** salvo acrónimos o nombres propios.
- **Sin punto final** al término de la descripción.
- **Máximo 72 caracteres** en la primera línea.
- Scope opcional pero recomendado cuando el cambio es localizado (ej: `feat(auth)`, `fix(prisma)`).
- Si hay breaking change, agregar `BREAKING CHANGE:` en el footer del body.
- Body separado por una línea en blanco, wrap a 72 caracteres.
