# Evals de los skills (claude plugin eval)

Pruebas unitarias de los skills del repo, fuera de `web/` (no se despliegan). `uap-skills/` es un plugin mínimo cuyo `commands/` es un enlace a `.claude/commands/`, porque las corridas de `claude plugin eval` no leen `.claude/` del repo: así se prueba el skill real, sin copia.

```bash
cd tools/evals/uap-skills
claude plugin eval . --trust-plugin --ablation none --no-publish --runs 3 --threshold 0.8 --max-cost-usd 4
```

- Cuesta unos 0,3 USD por la suite de hoy y necesita credencial de modelo; por eso es **on-demand, no un gate del build ni de CI**.
- Invoca el skill con su nombre de plugin (`/uap-skills:redaccion`): con `/redaccion` a secas no se cargó (nov 2026). Una invocación por barra no pasa por la herramienta `Skill`, así que un grader `tool_used: Skill` falla siempre y no sirve para esto.
- Las corridas no son deterministas (la documentación no fija semilla): un caso pasa con puntaje medio ≥ umbral, no con cada corrida.
- Un caso nuevo nace de un hallazgo del verificador que ninguna sonda puede vigilar (ver `docs/hallazgos-verificacion.md`): el caso fija el comportamiento correcto del skill y se corre tras tocar el skill.
- Formato: https://code.claude.com/docs/en/plugin-evals.md (`prompt.md` con frontmatter + `graders/*.md`; tipos `regex`, `tool_used`, `tool_order`, `file_exists`, `llm`, `baseline`).
