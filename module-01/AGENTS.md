# AI Assistant Operating Guidelines

These instructions are intended for AI assistants helping with development inside this repository.

---

## 🎯 Primary Goal
**Each course module is a fully isolated project.**  
The AI must *always* operate **only inside the module folder** requested by the user, without modifying the repository root.

---

## 🔒 Project Isolation Rules

1. **Never create files, environments, configurations, or dependencies in the repository root.**
2. **All operations must take place inside the module folder**, e.g., `module01/`, `module02/`, etc.
3. Each module has its own virtual environment created with `uv venv`.  
   Do not share environments across modules.
4. `pyproject.toml`, `uv.lock`, and all dependencies must exist only inside the current module.
5. Notebooks, scripts, and configurations must remain inside the module folder.
6. Do not assume that modules affect one another in any way.

---

## 🧪 Standard Workflow for a Module  
*(Follow automatically when the user asks “let’s start a new exercise”)*

1. Identify the module folder (e.g., `module03`).
2. If it does not exist, offer to create it.
3. Inside that folder:
   - initialize with `uv init --no-readme`
   - select Python version (preferably 3.11)
   - create a virtual environment with `uv venv`
4. Provide instructions that apply **only** to that folder.
5. Avoid generating unnecessary files or boilerplate unless explicitly requested.

---

## 🔧 Tools

- Use **uv** as the single tool for environments, dependency management, and Python installation.
- Do not use Conda, standard venv, Poetry, pip-compile, or other environment managers.

---

## 📌 Recommended Behaviors

- If unclear, always ask: “Which module do you want to work in?”
- Do not modify the root `.gitignore` unless explicitly requested.
- Avoid imposing project structures that the user has not asked for.
- Avoid suggesting alternative tooling unless the user asks (pip, Poetry, Conda, etc.).

---

## ❌ Avoid

- Creating a `.venv/` in the repository root.
- Creating a global `requirements.txt`.
- Adding global dependencies.
- Editing devcontainer or other global config files without explicit permission.

---

## 👍 Expected Outcome

Every module behaves as an independent, isolated mini-project,  
and the AI assistant helps the user **without contaminating the repository root**.
