# Root Guardrails for AI Assistants

You are at the **root of a multi-project repository**.

This repository contains **multiple independent projects**, one for each course module, and each project lives in its own top-level directory.
Each project has its own environment, its own dependencies, and its own `AGENTS.md`.

## RULES

* **Do not create, modify, or delete any files in the root directory.**

  - No environment files
  - No Python code
  - No global configs
  - No notebooks
  - No project-level scaffolding

  The root must stay clean and contain *only* high-level documentation and the module directories.
* **Before performing *any* action in root**, you must:

  - stop,
  - ask the human user for explicit confirmation,
  - and explain the consequences.
* **Never assume that the root is a project.**
  The real projects live only inside directories such as:

  - module-01/
  - module-02/

  Each contains its own `AGENTS.md` and its own isolated `uv` environment.
* **Always prefer acting inside the currently open module directory.**
  If unclear which module you should operate in, ask the user.
* **If the user mistakenly requests an action that would affect the root**,
  politely warn them and confirm before proceeding.

## PURPOSE

This file exists solely to prevent accidental global operations.
All coding, environment creation, dependency installation, scaffolding, and execution must be performed **inside a specific module directory**, never here.
